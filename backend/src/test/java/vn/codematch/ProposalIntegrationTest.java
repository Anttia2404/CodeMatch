package vn.codematch;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ProposalIntegrationTest {
    private static final Path STORAGE = Path.of(System.getProperty("java.io.tmpdir"), "codematch-m3-" + UUID.randomUUID());

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("codematch.cv.storage-dir", () -> STORAGE.toString());
    }

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper objectMapper;

    @BeforeEach
    void ensureStorageRootExists() throws Exception {
        Files.createDirectories(STORAGE);
    }

    @AfterAll
    static void removeTestCvStorage() throws Exception {
        if (!Files.exists(STORAGE)) return;
        try (var paths = Files.walk(STORAGE)) {
            paths.sorted(java.util.Comparator.reverseOrder()).forEach(path -> {
                try { Files.deleteIfExists(path); }
                catch (Exception exception) { throw new IllegalStateException("Unable to remove isolated test CV storage."); }
            });
        }
    }

    @Test
    void v4CreatesPrivateCvAndProposalTablesWithActiveUniqueness() {
        assertThat(jdbc.queryForObject("select version from flyway_schema_history where version = '4' and success", Integer.class)).isEqualTo(4);
        assertThat(jdbc.queryForObject("select count(*) from information_schema.tables where table_name in ('developer_cvs','teaching_proposals')", Integer.class)).isEqualTo(2);
        assertThat(jdbc.queryForObject("select count(*) from pg_indexes where indexname = 'teaching_proposals_one_active_per_developer'", Integer.class)).isEqualTo(1);
    }

    @Test
    void learnerDeveloperProposalAndAuthorizedCvDownloadFlowWorks() throws Exception {
        Session learner = account("learner");
        String requestId = createOpenRequest(learner, true);
        Session developer = developer("dev");

        MvcResult missingCv = submit(developer, requestId, proposal(null)).andExpect(status().isBadRequest()).andReturn();
        assertThat(missingCv.getResponse().getContentAsString()).contains("CV");

        String cvId = uploadCv(developer, pdf(), "resume.pdf").andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists()).andExpect(jsonPath("$.storageKey").doesNotExist())
            .andReturn().getResponse().getContentAsString();
        UUID parsedCvId = UUID.fromString(objectMapper.readTree(cvId).get("id").asText());
        String proposalBody = proposal(parsedCvId);
        MvcResult submitted = submit(developer, requestId, proposalBody)
            .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("SUBMITTED"))
            .andExpect(jsonPath("$.hasCv").value(true)).andExpect(jsonPath("$.cvId").doesNotExist())
            .andExpect(jsonPath("$.developer.displayName").value("Account dev"))
            .andExpect(jsonPath("$.developer.email").doesNotExist()).andReturn();
        String proposalId = objectMapper.readTree(submitted.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(get("/api/v1/me/learning-requests/{id}/proposals", requestId).cookie(learner.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(proposalId));
        mockMvc.perform(get("/api/v1/me/proposals").cookie(developer.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].learningRequestId").value(requestId));
        mockMvc.perform(get("/api/v1/proposals/{id}/cv", proposalId).cookie(learner.cookie()))
            .andExpect(status().isOk()).andExpect(header().string("Content-Type", "application/pdf"))
            .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")))
            .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("resume.pdf")))
            .andExpect(result -> assertThat(result.getResponse().getContentAsByteArray()).startsWith("%PDF-".getBytes()));

        Session unrelated = account("unrelated");
        mockMvc.perform(get("/api/v1/proposals/{id}", proposalId).cookie(unrelated.cookie())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/proposals/{id}/cv", proposalId).cookie(unrelated.cookie())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/developer/cvs/{id}/file", parsedCvId).cookie(unrelated.cookie())).andExpect(status().isNotFound());
        UUID unrelatedId = jdbc.queryForObject("select id from users where email = ?", UUID.class, unrelated.email());
        assertThat(jdbc.queryForObject("select count(*) from audit_events where actor_id = ? and event_type = 'CV_ACCESS_DENIED' and outcome = 'FAILURE'", Integer.class, unrelatedId)).isEqualTo(2);
        mockMvc.perform(get("/api/v1/proposals/{id}", proposalId).cookie(developer.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.hasCv").value(true));
    }

    @Test
    void pdfValidationReplacementOwnershipAndActiveProposalDeletionRulesAreEnforced() throws Exception {
        Session developer = developer("files");
        MockMultipartFile spoofedText = new MockMultipartFile("file", "resume.pdf", "application/pdf", "not a PDF".getBytes());
        mockMvc.perform(multipart("/api/v1/developer/cvs").file(spoofedText).with(csrf()).cookie(developer.cookie()))
            .andExpect(status().isBadRequest());
        MockMultipartFile tooLarge = new MockMultipartFile("file", "oversize.pdf", "application/pdf",
            new byte[(int) (5L * 1024 * 1024) + 1]);
        mockMvc.perform(multipart("/api/v1/developer/cvs").file(tooLarge).with(csrf()).cookie(developer.cookie()))
            .andExpect(status().isBadRequest());
        mockMvc.perform(multipart("/api/v1/developer/cvs").file(new MockMultipartFile("file", "resume.pdf", "application/pdf", pdf())))
            .andExpect(status().isForbidden());

        MvcResult created = uploadCv(developer, pdf(), "C:\\fakepath\\resume.pdf")
            .andExpect(status().isCreated()).andExpect(jsonPath("$.fileName").value("resume.pdf")).andReturn();
        String cvId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asText();
        mockMvc.perform(get("/api/v1/developer/cvs").cookie(developer.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(cvId));
        mockMvc.perform(get("/api/v1/developer/cvs/{id}/file", cvId).cookie(developer.cookie()))
            .andExpect(status().isOk());

        Session learner = account("file-owner");
        String requestId = createOpenRequest(learner, false);
        String proposalId = objectMapper.readTree(submit(developer, requestId, proposal(UUID.fromString(cvId)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asText();
        mockMvc.perform(delete("/api/v1/developer/cvs/{id}", cvId).with(csrf()).cookie(developer.cookie()))
            .andExpect(status().isConflict());
        Session unrelated = developer("another");
        mockMvc.perform(multipart("/api/v1/developer/cvs/{id}", cvId)
                .file(new MockMultipartFile("file", "replacement.pdf", "application/pdf", pdf()))
                .with(request -> { request.setMethod("PUT"); return request; }).with(csrf()).cookie(unrelated.cookie()))
            .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/proposals/{id}/withdraw", proposalId).with(csrf()).cookie(developer.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("WITHDRAWN"));
        mockMvc.perform(delete("/api/v1/developer/cvs/{id}", cvId).with(csrf()).cookie(developer.cookie()))
            .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/proposals/{id}", proposalId).cookie(learner.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.hasCv").value(false));
    }

    @Test
    void selfApplicationClosedRequestsAndDuplicateActiveProposalsAreRejected() throws Exception {
        Session learner = developer("self");
        String requestId = createOpenRequest(learner, false);
        mockMvc.perform(post("/api/v1/learning-requests/{id}/proposals", requestId).with(csrf()).cookie(learner.cookie())
                .contentType(MediaType.APPLICATION_JSON).content(proposal(null)))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("self_application"));

        Session developer = developer("duplicate");
        submit(developer, requestId, proposal(null)).andExpect(status().isCreated());
        submit(developer, requestId, proposal(null)).andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("active_proposal_exists"));
        closeRequest(learner, requestId);
        Session newDeveloper = developer("closed");
        submit(newDeveloper, requestId, proposal(null)).andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("request_not_open"));
    }

    @Test
    void proposalOwnerCanEditWithdrawAndSubmitAgainAfterWithdrawal() throws Exception {
        Session learner = account("edit-learner");
        String requestId = createOpenRequest(learner, false);
        Session developer = developer("edit-dev");
        String proposalId = objectMapper.readTree(submit(developer, requestId, proposal(null))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asText();
        String edited = proposal(null).replace("\"proposedRate\":200000", "\"proposedRate\":350000");
        mockMvc.perform(patch("/api/v1/proposals/{id}", proposalId).with(csrf()).cookie(developer.cookie())
                .contentType(MediaType.APPLICATION_JSON).content(edited))
            .andExpect(status().isOk()).andExpect(jsonPath("$.proposedRate").value(350000));
        Session unrelated = developer("edit-unrelated");
        mockMvc.perform(patch("/api/v1/proposals/{id}", proposalId).with(csrf()).cookie(unrelated.cookie())
                .contentType(MediaType.APPLICATION_JSON).content(edited))
            .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/proposals/{id}/withdraw", proposalId).with(csrf()).cookie(developer.cookie()))
            .andExpect(status().isOk());
        submit(developer, requestId, proposal(null)).andExpect(status().isCreated());
    }

    @Test
    void concurrentDuplicateSubmissionsCreateOnlyOneActiveProposal() throws Exception {
        Session learner = account("concurrent-learner");
        String requestId = createOpenRequest(learner, false);
        Session developer = developer("concurrent-dev");
        Callable<Integer> submit = () -> mockMvc.perform(post("/api/v1/learning-requests/{id}/proposals", requestId)
                .with(csrf()).cookie(developer.cookie()).contentType(MediaType.APPLICATION_JSON).content(proposal(null)))
            .andReturn().getResponse().getStatus();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var responses = executor.invokeAll(List.of(submit, submit));
            List<Integer> statuses = responses.stream().map(result -> {
                try { return result.get(); }
                catch (Exception exception) { throw new IllegalStateException(exception); }
            }).sorted().toList();
            assertThat(statuses).containsExactly(201, 409);
        }
        assertThat(jdbc.queryForObject("select count(*) from teaching_proposals where learning_request_id = ?::uuid and status='SUBMITTED'",
            Integer.class, requestId)).isEqualTo(1);
    }

    private Session account(String prefix) throws Exception {
        String email = prefix + "-" + UUID.randomUUID() + "@example.test";
        String password = "Correct-Horse-83!";
        String register = "{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"displayName\":\"Account " + prefix + "\"}";
        mockMvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(register))
            .andExpect(status().isCreated());
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
            .andExpect(status().isOk()).andReturn();
        return new Session(email, login.getResponse().getCookie("CMSESSION"));
    }

    private Session developer(String prefix) throws Exception {
        Session developer = account(prefix);
        String skillId = skillId().toString();
        String profile = """
            {"headline":"Developer profile %s","biography":"I teach coding through clear explanations and hands-on projects.",
             "yearsExperience":5,"githubUrl":null,"linkedinUrl":null,"portfolioUrl":null,
             "teachingApproach":"We start from a small example, then build practical features together.",
             "availability":"Evenings and weekends","skillIds":["%s"]}
            """.formatted(prefix, skillId);
        mockMvc.perform(post("/api/v1/developers/me").with(csrf()).cookie(developer.cookie())
                .contentType(MediaType.APPLICATION_JSON).content(profile))
            .andExpect(status().isCreated());
        return developer;
    }

    private String createOpenRequest(Session learner, boolean requiresCv) throws Exception {
        String body = """
            {"title":"Learning request for proposal test","description":"I want to learn by building a practical small project.",
             "learningGoal":"Build a small app and understand its core architecture.","currentLevel":"BASIC","preferredFormat":"ONLINE",
             "city":null,"budgetMin":null,"budgetMax":null,"budgetUnit":null,"preferredSchedule":"Weekday evenings",
             "expectedDuration":"Four weeks","teachingExpectations":"Explain concepts and pair on practical examples.",
             "requiresCv":%s,"skillIds":["%s"]}
            """.formatted(requiresCv, skillId());
        MvcResult draft = mockMvc.perform(post("/api/v1/learning-requests").with(csrf()).cookie(learner.cookie())
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated()).andReturn();
        String id = objectMapper.readTree(draft.getResponse().getContentAsString()).get("id").asText();
        mockMvc.perform(post("/api/v1/learning-requests/{id}/publish", id).with(csrf()).cookie(learner.cookie()))
            .andExpect(status().isOk());
        return id;
    }

    private void closeRequest(Session learner, String requestId) throws Exception {
        mockMvc.perform(post("/api/v1/learning-requests/{id}/close", requestId).with(csrf()).cookie(learner.cookie()))
            .andExpect(status().isOk());
    }

    private org.springframework.test.web.servlet.ResultActions uploadCv(Session developer, byte[] bytes, String fileName) throws Exception {
        return mockMvc.perform(multipart("/api/v1/developer/cvs")
            .file(new MockMultipartFile("file", fileName, "application/pdf", bytes)).with(csrf()).cookie(developer.cookie()));
    }

    private org.springframework.test.web.servlet.ResultActions submit(Session developer, String requestId, String command) throws Exception {
        return mockMvc.perform(post("/api/v1/learning-requests/{id}/proposals", requestId).with(csrf()).cookie(developer.cookie())
            .contentType(MediaType.APPLICATION_JSON).content(command));
    }

    private String proposal(UUID cvId) {
        return """
            {"introduction":"I can help you understand the topic and make steady progress through a real project.",
             "teachingApproach":"We will break the goal into small steps and practice each idea with working code.",
             "relevantExperience":"I have built and taught several small web applications with this stack.",
             "proposedRate":200000,"rateUnit":"PER_SESSION","proposedSchedule":"Tuesday and Thursday evenings",
             "estimatedDuration":"Four weekly sessions","cvId":%s,"removeCv":false}
            """.formatted(cvId == null ? "null" : "\"" + cvId + "\"");
    }

    private UUID skillId() {
        return jdbc.queryForObject("select id from skills where slug = 'react'", UUID.class);
    }

    private byte[] pdf() throws Exception {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            document.addPage(new PDPage());
            document.save(output);
            return output.toByteArray();
        }
    }

    private record Session(String email, Cookie cookie) {}
}
