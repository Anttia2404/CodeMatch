package vn.codematch;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class LearningRequestIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbcTemplate;

    @Test
    void flywayV3CreatesLearningAndSavedRequestSchema() {
        assertThat(jdbcTemplate.queryForObject("select version from flyway_schema_history where success = true order by installed_rank desc limit 1", String.class)).isEqualTo("3");
        assertThat(jdbcTemplate.queryForObject("select count(*) from information_schema.tables where table_name in ('learning_requests', 'learning_request_skills', 'saved_requests')", Integer.class)).isEqualTo(3);
        assertThat(jdbcTemplate.queryForList("select indexname from pg_indexes where tablename = 'learning_requests'", String.class))
            .contains("learning_requests_open_published_idx", "learning_requests_owner_status_updated_idx");
    }

    @Test
    void onlyAuthenticatedUsersCanCreateAndCsrfIsStillRequired() throws Exception {
        mockMvc.perform(post("/api/v1/learning-requests").with(csrf().useInvalidToken()).contentType(MediaType.APPLICATION_JSON).content(command()))
            .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/learning-requests").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(command()))
            .andExpect(status().isUnauthorized());
        Cookie learner = registerAndLogin("create");
        mockMvc.perform(post("/api/v1/learning-requests").with(csrf()).cookie(learner)
                .contentType(MediaType.APPLICATION_JSON).content(command()))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void draftsArePrivateAndPublicProjectionContainsNoAccountData() throws Exception {
        Cookie learner = registerAndLogin("privacy");
        String id = createDraft(learner, command());
        mockMvc.perform(get("/api/v1/learning-requests/" + id)).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/learning-requests/" + id).cookie(learner))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DRAFT"));
        mockMvc.perform(post("/api/v1/learning-requests/" + id + "/publish").with(csrf()).cookie(learner))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("OPEN"))
            .andExpect(jsonPath("$.requiresCv").value(true));
        mockMvc.perform(get("/api/v1/learning-requests/" + id))
            .andExpect(status().isOk()).andExpect(jsonPath("$.skills.length()").value(1))
            .andExpect(jsonPath("$.currency").value("VND"))
            .andExpect(jsonPath("$.email").doesNotExist()).andExpect(jsonPath("$.learnerId").doesNotExist());
    }

    @Test
    void ownerCanEditAndPublishButAnotherUserCannotModifyTheRequest() throws Exception {
        Cookie owner = registerAndLogin("owner");
        Cookie other = registerAndLogin("other");
        String id = createDraft(owner, command());
        mockMvc.perform(patch("/api/v1/learning-requests/" + id).with(csrf()).cookie(other)
                .contentType(MediaType.APPLICATION_JSON).content(command().replace("Hooks React", "Other title")))
            .andExpect(status().isNotFound());
        mockMvc.perform(patch("/api/v1/learning-requests/" + id).with(csrf()).cookie(owner)
                .contentType(MediaType.APPLICATION_JSON).content(command().replace("Hooks React", "React nâng cao")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("React nâng cao"));
        mockMvc.perform(post("/api/v1/learning-requests/" + id + "/publish").with(csrf()).cookie(other))
            .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/learning-requests/" + id + "/publish").with(csrf()).cookie(owner))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/learning-requests/" + id + "/publish").with(csrf()).cookie(owner))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("invalid_transition"));
    }

    @Test
    void budgetAndLocationRulesRejectInvalidRequests() throws Exception {
        Cookie learner = registerAndLogin("validation");
        mockMvc.perform(post("/api/v1/learning-requests").with(csrf()).cookie(learner).contentType(MediaType.APPLICATION_JSON)
                .content(command().replace("\"budgetMin\":200000,\"budgetMax\":500000", "\"budgetMin\":600000,\"budgetMax\":500000")))
            .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/learning-requests").with(csrf()).cookie(learner).contentType(MediaType.APPLICATION_JSON)
                .content(command().replace("\"city\":\"Đà Nẵng\",", "\"city\":null,")))
            .andExpect(status().isBadRequest());
        assertThat(jdbcTemplate.queryForObject("select count(*) from learning_requests where learner_id = (select id from users where email = ?)", Integer.class, lastEmail))
            .isZero();
    }

    private String lastEmail;

    @Test
    void invalidOrDuplicateSkillsAreRejected() throws Exception {
        Cookie learner = registerAndLogin("skills");
        String skill = skillId();
        String duplicate = command().replace("\"skillIds\":[\"" + skill + "\"]",
            "\"skillIds\":[\"" + skill + "\",\"" + skill + "\"]");
        mockMvc.perform(post("/api/v1/learning-requests").with(csrf()).cookie(learner).contentType(MediaType.APPLICATION_JSON).content(duplicate))
            .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/learning-requests").with(csrf()).cookie(learner).contentType(MediaType.APPLICATION_JSON)
                .content(command().replaceFirst("[0-9a-f-]{36}", "00000000-0000-0000-0000-000000000000")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void discoverySearchesPostgresByKeywordSkillFormatBudgetAndCvAndPaginates() throws Exception {
        Cookie learner = registerAndLogin("search");
        String id = createDraft(learner, command());
        mockMvc.perform(post("/api/v1/learning-requests/" + id + "/publish").with(csrf()).cookie(learner)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/learning-requests").param("q", "Hooks").param("format", "OFFLINE")
                .param("skillIds", skillId()).param("minBudget", "300000").param("maxBudget", "600000")
                .param("budgetUnit", "PER_SESSION").param("requiresCv", "true").param("page", "0").param("size", "1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.content[0].id").value(id)).andExpect(jsonPath("$.size").value(1));
        mockMvc.perform(get("/api/v1/learning-requests").param("q", "not present"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0));
        mockMvc.perform(get("/api/v1/learning-requests").param("size", "51"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void learnersCanSaveUnsaveAndReadSavedRequestsIdempotently() throws Exception {
        Cookie learner = registerAndLogin("saved");
        String id = createDraft(learner, command());
        mockMvc.perform(put("/api/v1/saved-requests/" + id).with(csrf()).cookie(learner)).andExpect(status().isConflict());
        mockMvc.perform(post("/api/v1/learning-requests/" + id + "/publish").with(csrf()).cookie(learner)).andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/saved-requests/" + id).with(csrf()).cookie(learner)).andExpect(status().isNoContent());
        mockMvc.perform(put("/api/v1/saved-requests/" + id).with(csrf()).cookie(learner)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/saved-requests").cookie(learner)).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(id));
        assertThat(jdbcTemplate.queryForObject("select count(*) from saved_requests where learning_request_id = ?::uuid", Integer.class, id)).isEqualTo(1);
        mockMvc.perform(delete("/api/v1/saved-requests/" + id).with(csrf()).cookie(learner)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/saved-requests").cookie(learner)).andExpect(status().isOk()).andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(0)));
    }

    @Test
    void closeRemovesRequestFromDiscoveryButKeepsItVisibleInOwnerAndSavedLists() throws Exception {
        Cookie learner = registerAndLogin("close");
        String uniqueCommand = command().replace("Hooks React", "Close lifecycle unique");
        String id = createDraft(learner, uniqueCommand);
        mockMvc.perform(post("/api/v1/learning-requests/" + id + "/close").with(csrf()).cookie(learner))
            .andExpect(status().isConflict());
        mockMvc.perform(post("/api/v1/learning-requests/" + id + "/publish").with(csrf()).cookie(learner)).andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/saved-requests/" + id).with(csrf()).cookie(learner)).andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/learning-requests/" + id + "/close").with(csrf()).cookie(learner))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CLOSED"));
        mockMvc.perform(get("/api/v1/learning-requests").param("q", "Close lifecycle unique"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(get("/api/v1/learning-requests/" + id)).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/me/learning-requests").param("status", "CLOSED").cookie(learner))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(id));
        mockMvc.perform(get("/api/v1/saved-requests").cookie(learner))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("CLOSED"));
        mockMvc.perform(patch("/api/v1/learning-requests/" + id).with(csrf()).cookie(learner)
                .contentType(MediaType.APPLICATION_JSON).content(uniqueCommand))
            .andExpect(status().isConflict());
    }

    @Test
    void ownerCanUseLearnerEndpointsEvenWithoutChangingDeveloperCapabilities() throws Exception {
        Cookie learner = registerAndLogin("dashboard");
        String id = createDraft(learner, command());
        mockMvc.perform(get("/api/v1/me/learning-requests").cookie(learner))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].status").value("DRAFT"));
        mockMvc.perform(get("/api/v1/me/learning-requests"))
            .andExpect(status().isUnauthorized());
        assertThat(id).isNotBlank();
    }

    private Cookie registerAndLogin(String prefix) throws Exception {
        lastEmail = prefix + "-" + java.util.UUID.randomUUID() + "@example.test";
        String body = "{\"email\":\"" + lastEmail + "\",\"password\":\"Correct-Horse-83!\",\"displayName\":\"Test Learner\"}";
        mockMvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());
        var response = mockMvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(
                "{\"email\":\"" + lastEmail + "\",\"password\":\"Correct-Horse-83!\"}"))
            .andExpect(status().isOk()).andReturn();
        return response.getResponse().getCookie("CMSESSION");
    }

    private String createDraft(Cookie learner, String body) throws Exception {
        var response = mockMvc.perform(post("/api/v1/learning-requests").with(csrf()).cookie(learner)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated()).andReturn();
        return JsonPath.read(response.getResponse().getContentAsString(), "$.id");
    }

    private String skillId() {
        return jdbcTemplate.queryForObject("select id from skills where slug = 'react'", String.class);
    }

    private String command() {
        return """
            {"title":"Hooks React","description":"Tôi muốn luyện tập React qua dự án nhỏ.","learningGoal":"Tự xây ứng dụng quản lý công việc.",
             "currentLevel":"BASIC","preferredFormat":"OFFLINE","city":"Đà Nẵng","budgetMin":200000,"budgetMax":500000,
             "budgetUnit":"PER_SESSION","preferredSchedule":"Buổi tối cuối tuần","expectedDuration":"4 buổi",
             "teachingExpectations":"Giải thích từng bước, có thực hành.","requiresCv":true,"skillIds":["%s"]}
            """.formatted(skillId());
    }
}
