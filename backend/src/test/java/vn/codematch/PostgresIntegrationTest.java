package vn.codematch;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import jakarta.servlet.http.Cookie;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
class PostgresIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void flywayCreatesItsSchemaHistoryAndDatabaseAcceptsQueries() {
        Integer migrationCount = jdbcTemplate.queryForObject(
            "select count(*) from flyway_schema_history where success = true", Integer.class);
        String databaseName = jdbcTemplate.queryForObject("select current_database()", String.class);

        assertThat(migrationCount).isEqualTo(6);
        assertThat(databaseName).startsWith("test");
        assertThat(jdbcTemplate.queryForObject("select count(*) from skills", Integer.class)).isEqualTo(11);
        assertThat(jdbcTemplate.queryForObject("select count(*) from information_schema.tables where table_name = 'spring_session'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("select count(*) from information_schema.tables where table_name = 'moderation_reports'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("select count(*) from information_schema.tables where table_name = 'audit_events'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("select column_default from information_schema.columns where table_name = 'users' and column_name = 'is_admin'", String.class)).isEqualTo("false");
    }

    @Test
    void adminApiRequiresExplicitDatabaseRoleAndAuthenticationFailuresAreAudited() throws Exception {
        mockMvc.perform(get("/api/v1/admin/reports")).andExpect(status().isUnauthorized());

        String email = registerAccount("moderation");
        Cookie userSession = login(email);
        mockMvc.perform(get("/api/v1/admin/reports").cookie(userSession)).andExpect(status().isForbidden());
        int failuresBefore = jdbcTemplate.queryForObject("select count(*) from audit_events where event_type = 'AUTHENTICATION_FAILED' and outcome = 'FAILURE'", Integer.class);
        mockMvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"Wrong-Password-83!\"}"))
            .andExpect(status().isUnauthorized());

        assertThat(jdbcTemplate.queryForObject("select count(*) from audit_events where event_type = 'AUTHENTICATION_FAILED' and outcome = 'FAILURE'", Integer.class)).isEqualTo(failuresBefore + 1);
        assertThat(jdbcTemplate.queryForObject("select is_admin from users where email = ?", Boolean.class, email)).isFalse();
        jdbcTemplate.update("update users set is_admin = true where email = ?", email);
        Cookie adminSession = login(email);
        mockMvc.perform(get("/api/v1/admin/reports").cookie(adminSession)).andExpect(status().isOk());
    }

    @Test
    void reportsRequireVisibleTargetsPreventDuplicatesAndCanBeReviewedAndHidden() throws Exception {
        String ownerEmail = registerAccount("report-owner");
        String reporterEmail = registerAccount("reporter");
        String adminEmail = registerAccount("report-admin");
        jdbcTemplate.update("update users set is_admin = true where email = ?", adminEmail);
        Cookie owner = login(ownerEmail);
        Cookie reporter = login(reporterEmail);
        Cookie admin = login(adminEmail);
        String skill = jdbcTemplate.queryForObject("select id from skills where slug = 'react'", String.class);
        String requestBody = """
            {"title":"Request to report","description":"I want to practice React by building a small application.","learningGoal":"Practice React",
             "currentLevel":"BASIC","preferredFormat":"ONLINE","city":null,"budgetMin":null,"budgetMax":null,
             "budgetUnit":null,"preferredSchedule":"Evenings","expectedDuration":"Four weeks",
             "teachingExpectations":"Practice React with weekly project tasks.","requiresCv":false,"skillIds":["%s"]}
            """.formatted(skill);
        var draft = mockMvc.perform(post("/api/v1/learning-requests").with(csrf()).cookie(owner)
                .contentType(MediaType.APPLICATION_JSON).content(requestBody))
            .andExpect(status().isCreated()).andReturn();
        String requestId = com.jayway.jsonpath.JsonPath.read(draft.getResponse().getContentAsString(), "$.id");
        mockMvc.perform(post("/api/v1/learning-requests/" + requestId + "/publish").with(csrf()).cookie(owner))
            .andExpect(status().isOk());

        String reportBody = "{\"targetType\":\"LEARNING_REQUEST\",\"targetId\":\"" + requestId
            + "\",\"reason\":\"SPAM\",\"description\":\"Please review this listing.\"}";
        var created = mockMvc.perform(post("/api/v1/reports").with(csrf()).cookie(reporter)
                .contentType(MediaType.APPLICATION_JSON).content(reportBody))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("OPEN"))
            .andExpect(jsonPath("$.description").value("Please review this listing."))
            .andExpect(jsonPath("$.targetTitle").doesNotExist()).andReturn();
        String reportId = com.jayway.jsonpath.JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        mockMvc.perform(post("/api/v1/reports").with(csrf()).cookie(reporter)
                .contentType(MediaType.APPLICATION_JSON).content(reportBody))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("duplicate_report"));
        mockMvc.perform(post("/api/v1/reports").with(csrf()).cookie(owner)
                .contentType(MediaType.APPLICATION_JSON).content(reportBody))
            .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/admin/reports/" + reportId + "/review").with(csrf()).cookie(admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"RESOLVED\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RESOLVED"));
        mockMvc.perform(put("/api/v1/saved-requests/" + requestId).with(csrf()).cookie(reporter))
            .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/admin/learning-requests/" + requestId + "/hide").with(csrf()).cookie(admin))
            .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/learning-requests/" + requestId)).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/learning-requests/" + requestId).cookie(owner)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/learning-requests/" + requestId).cookie(admin)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/saved-requests").cookie(reporter)).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mockMvc.perform(post("/api/v1/admin/learning-requests/" + requestId + "/restore").with(csrf()).cookie(admin))
            .andExpect(status().isNoContent());
        assertThat(jdbcTemplate.queryForObject("select count(*) from audit_events where target_id = ? and outcome = 'SUCCESS'", Integer.class, java.util.UUID.fromString(requestId))).isEqualTo(2);

        UUID reporterId = jdbcTemplate.queryForObject("select id from users where email = ?", UUID.class, reporterEmail);
        mockMvc.perform(post("/api/v1/admin/users/" + reporterId + "/suspend").with(csrf()).cookie(admin))
            .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/auth/me").cookie(reporter)).andExpect(status().isUnauthorized());
        assertThat(jdbcTemplate.queryForObject("select count(*) from audit_events where event_type='ACCOUNT_SUSPENDED' and target_id=?", Integer.class, reporterId)).isEqualTo(1);
    }

    @Test
    void healthEndpointReportsDatabaseBackedApplicationAsUp() {
        ResponseEntity<String> response = restTemplate.getForEntity("/actuator/health", String.class);
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).contains("\"status\":\"UP\"");
    }

    @Test
    void registrationHashesPasswordsAndPreventsCaseInsensitiveDuplicates() throws Exception {
        String email = "m1-" + java.util.UUID.randomUUID() + "@example.test";
        String registration = """
            {"email":"%s","password":"Correct-Horse-83!","displayName":"Nguyễn An"}
            """.formatted(email);

        mockMvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(registration))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value(email));

        String hash = jdbcTemplate.queryForObject("select password_hash from users where email = ?", String.class, email);
        assertThat(hash).isNotEqualTo("Correct-Horse-83!");
        assertThat(passwordEncoder.matches("Correct-Horse-83!", hash)).isTrue();

        String duplicate = """
            {"email":"%s","password":"Another-Password-11!","displayName":"Nguyễn An"}
            """.formatted(email.toUpperCase(java.util.Locale.ROOT));
        mockMvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(duplicate))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("email_unavailable"));
    }

    @Test
    void registrationRejectsInvalidInputAndRequiresCsrf() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"bad\",\"password\":\"short\",\"displayName\":\"\"}"))
            .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"bad\",\"password\":\"short\",\"displayName\":\"\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("validation_failed"));
    }

    @Test
    void loginUsesGenericFailureAndCreatesInvalidatableSession() throws Exception {
        String email = registerAccount("login");
        String wrongPassword = "{\"email\":\"" + email + "\",\"password\":\"Wrong-Password-83!\"}";
        mockMvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(wrongPassword))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.detail").value("Email hoặc mật khẩu không đúng."));

        String correctPassword = "{\"email\":\"" + email + "\",\"password\":\"Correct-Horse-83!\"}";
        var loginResult = mockMvc.perform(post("/api/v1/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(correctPassword))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.passwordHash").doesNotExist())
            .andReturn();

        Cookie session = loginResult.getResponse().getCookie("CMSESSION");
        assertThat(session).isNotNull();
        mockMvc.perform(get("/api/v1/auth/me").cookie(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email));

        mockMvc.perform(post("/api/v1/auth/logout").with(csrf()).cookie(session))
            .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/auth/me").cookie(session))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void developerProfileIsPrivateToWriteAndPublicToReadWithoutAccountData() throws Exception {
        String email = registerAccount("profile");
        Cookie ownerSession = login(email);
        var skills = jdbcTemplate.queryForList("select id from skills where slug in ('java', 'react') order by slug", java.util.UUID.class);
        String command = """
            {"headline":"Developer Java & React","biography":"Hướng dẫn từng bước, tập trung thực hành.","yearsExperience":6,
             "githubUrl":"https://github.com/example","linkedinUrl":null,"portfolioUrl":"https://example.test",
             "teachingApproach":"Giải thích qua project nhỏ.","availability":"Buổi tối trong tuần.","skillIds":["%s","%s"]}
            """.formatted(skills.get(0), skills.get(1));

        var created = mockMvc.perform(post("/api/v1/developers/me").with(csrf()).cookie(ownerSession)
                .contentType(MediaType.APPLICATION_JSON).content(command))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.headline").value("Developer Java & React"))
            .andExpect(jsonPath("$.skills.length()").value(2))
            .andExpect(jsonPath("$.email").doesNotExist())
            .andReturn();
        String profileId = com.jayway.jsonpath.JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        mockMvc.perform(get("/api/v1/developers/" + profileId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.displayName").value("Test User"))
            .andExpect(jsonPath("$.email").doesNotExist());

        mockMvc.perform(post("/api/v1/developers/me").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(command))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/developers/me"))
            .andExpect(status().isUnauthorized());

        String update = command.replace("Developer Java & React", "Mentor Java & React");
        mockMvc.perform(put("/api/v1/developers/me").with(csrf()).cookie(ownerSession)
                .contentType(MediaType.APPLICATION_JSON).content(update))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.headline").value("Mentor Java & React"));
    }

    @Test
    void invalidSkillSelectionDoesNotCreateProfile() throws Exception {
        String email = registerAccount("badskill");
        Cookie ownerSession = login(email);
        String command = """
            {"headline":"Developer","biography":"Biography","yearsExperience":4,"teachingApproach":"Practice first",
             "availability":"Weekends","skillIds":["00000000-0000-0000-0000-000000000000"]}
            """;
        mockMvc.perform(post("/api/v1/developers/me").with(csrf()).cookie(ownerSession)
                .contentType(MediaType.APPLICATION_JSON).content(command))
            .andExpect(status().isBadRequest());
        assertThat(jdbcTemplate.queryForObject("select count(*) from developer_profiles where user_id = (select id from users where email = ?)", Integer.class, email)).isZero();
    }

    private String registerAccount(String prefix) throws Exception {
        String email = prefix + "-" + java.util.UUID.randomUUID() + "@example.test";
        String body = "{\"email\":\"" + email + "\",\"password\":\"Correct-Horse-83!\",\"displayName\":\"Test User\"}";
        mockMvc.perform(post("/api/v1/auth/register").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());
        return email;
    }

    private Cookie login(String email) throws Exception {
        String body = "{\"email\":\"" + email + "\",\"password\":\"Correct-Horse-83!\"}";
        var result = mockMvc.perform(post("/api/v1/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andReturn();
        return result.getResponse().getCookie("CMSESSION");
    }
}
