package vn.codematch;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class MatchIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void flywayV5AndV6CreateConfirmedMatchModerationAndAuditSchema() {
        assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history where version='5' and success", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from information_schema.tables where table_name='matches'", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForList("select indexname from pg_indexes where tablename='matches'", String.class))
            .contains("matches_one_per_request", "matches_selected_proposal_unique", "matches_developer_created_idx");
        assertThat(jdbc.queryForObject("select pg_get_constraintdef(oid) from pg_constraint where conname='matches_selected_proposal_fk'", String.class))
            .contains("selected_proposal_id, learning_request_id, developer_profile_id");
        assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history where version='6' and success", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from information_schema.tables where table_name in ('moderation_reports','audit_events')", Integer.class)).isEqualTo(2);
    }

    @Test
    void learnerSelectsProposalClosesRequestAndRetainsUnselectedProposal() throws Exception {
        Session learner = account("select-learner");
        String requestId = createOpenRequest(learner, "selection");
        Session chosenDeveloper = developer("chosen");
        Session otherDeveloper = developer("other");
        String chosenProposal = submit(otherDeveloper, requestId);
        String otherProposal = submit(chosenDeveloper, requestId);

        MvcResult selection = select(learner, requestId, chosenProposal).andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.selectedProposalId").value(chosenProposal))
            .andExpect(jsonPath("$.proposal.status").value("SUBMITTED"))
            .andExpect(jsonPath("$.developer.displayName").value("Account other"))
            .andReturn();
        String matchId = objectMapper.readTree(selection.getResponse().getContentAsString()).get("id").asText();
        UUID learnerId = jdbc.queryForObject("select id from users where email = ?", UUID.class, learner.email());

        mockMvc.perform(get("/api/v1/learning-requests/{id}", requestId).cookie(learner.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("MATCHED"));
        assertThat(jdbc.queryForObject("select count(*) from matches where learning_request_id=?::uuid", Integer.class, requestId)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from audit_events where actor_id=? and event_type='MATCH_CONFIRMED' and target_id=?", Integer.class, learnerId, UUID.fromString(matchId))).isEqualTo(1);
        assertThat(jdbc.queryForObject("select status from teaching_proposals where id=?::uuid", String.class, otherProposal)).isEqualTo("SUBMITTED");
        select(learner, requestId, otherProposal).andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("request_already_matched"));
        mockMvc.perform(post("/api/v1/learning-requests/{id}/proposals", requestId).with(csrf()).cookie(developer("late").cookie())
                .contentType(MediaType.APPLICATION_JSON).content(proposalBody()))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("request_not_open"));

        mockMvc.perform(get("/api/v1/me/learning-requests/{id}/match", requestId).cookie(learner.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(matchId));
    }

    @Test
    void sameSelectionIsIdempotentAndDifferentSelectionConflicts() throws Exception {
        Session learner = account("idempotent-learner");
        String requestId = createOpenRequest(learner, "idempotent");
        String first = submit(developer("idempotent-one"), requestId);
        String second = submit(developer("idempotent-two"), requestId);
        String matchId = objectMapper.readTree(select(learner, requestId, first).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString()).get("id").asText();
        select(learner, requestId, first).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(matchId));
        select(learner, requestId, second).andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("request_already_matched"));
        assertThat(jdbc.queryForObject("select count(*) from matches where learning_request_id=?::uuid", Integer.class, requestId)).isEqualTo(1);
    }

    @Test
    void ownershipCrossRequestWithdrawnAndClosedChecksDoNotPersistSelection() throws Exception {
        Session learner = account("rules-learner");
        Session otherLearner = account("rules-other-learner");
        String requestId = createOpenRequest(learner, "rules");
        String otherRequestId = createOpenRequest(otherLearner, "cross-request");
        Session developer = developer("rules-dev");
        String proposalId = submit(developer, requestId);
        String otherProposalId = submit(developer("cross-dev"), otherRequestId);

        select(otherLearner, requestId, proposalId).andExpect(status().isNotFound());
        select(learner, requestId, otherProposalId).andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/proposals/{id}/withdraw", proposalId).with(csrf()).cookie(developer.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("WITHDRAWN"));
        select(learner, requestId, proposalId).andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("proposal_withdrawn"));
        assertThat(jdbc.queryForObject("select status from learning_requests where id=?::uuid", String.class, requestId)).isEqualTo("OPEN");
        assertThat(jdbc.queryForObject("select count(*) from matches where learning_request_id=?::uuid", Integer.class, requestId)).isZero();

        String closedRequestId = createOpenRequest(learner, "closed");
        String closedProposalId = submit(developer("closed-dev"), closedRequestId);
        mockMvc.perform(post("/api/v1/learning-requests/{id}/close", closedRequestId).with(csrf()).cookie(learner.cookie()))
            .andExpect(status().isOk());
        select(learner, closedRequestId, closedProposalId).andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("request_not_open"));
        assertThat(jdbc.queryForObject("select count(*) from matches where learning_request_id=?::uuid", Integer.class, closedRequestId)).isZero();
    }

    @Test
    void simultaneousSelectionsCreateExactlyOneMatch() throws Exception {
        Session learner = account("concurrent-learner");
        String requestId = createOpenRequest(learner, "concurrent");
        String first = submit(developer("concurrent-one"), requestId);
        String second = submit(developer("concurrent-two"), requestId);
        Callable<Integer> selectFirst = () -> select(learner, requestId, first).andReturn().getResponse().getStatus();
        Callable<Integer> selectSecond = () -> select(learner, requestId, second).andReturn().getResponse().getStatus();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var results = executor.invokeAll(List.of(selectFirst, selectSecond));
            List<Integer> statuses = results.stream().map(result -> {
                try { return result.get(); }
                catch (Exception exception) { throw new IllegalStateException(exception); }
            }).sorted().toList();
            assertThat(statuses).containsExactly(200, 409);
        }
        assertThat(jdbc.queryForObject("select count(*) from matches where learning_request_id=?::uuid", Integer.class, requestId)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select status from learning_requests where id=?::uuid", String.class, requestId)).isEqualTo("MATCHED");
    }

    @Test
    void selectedDeveloperCanReadMatchButUnselectedAndUnrelatedDevelopersCannotReadPrivateDetails() throws Exception {
        Session learner = account("visibility-learner");
        String requestId = createOpenRequest(learner, "visibility");
        Session selected = developer("selected");
        Session unselected = developer("unselected");
        Session unrelated = developer("unrelated");
        String selectedProposal = submit(selected, requestId);
        String unselectedProposal = submit(unselected, requestId);
        String matchId = objectMapper.readTree(select(learner, requestId, selectedProposal).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(get("/api/v1/me/matches").cookie(selected.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(matchId));
        mockMvc.perform(get("/api/v1/me/matches/{id}", matchId).cookie(selected.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.learningRequestTitle").exists());
        mockMvc.perform(get("/api/v1/me/matches/{id}", matchId).cookie(unselected.cookie())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/me/matches/{id}", matchId).cookie(unrelated.cookie())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/proposals/{id}/selection-status", selectedProposal).cookie(selected.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.selectionStatus").value("SELECTED"));
        mockMvc.perform(get("/api/v1/proposals/{id}/selection-status", unselectedProposal).cookie(unselected.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.selectionStatus").value("NOT_SELECTED"));
        mockMvc.perform(get("/api/v1/proposals/{id}/selection-status", selectedProposal).cookie(unrelated.cookie()))
            .andExpect(status().isNotFound());
    }

    @Test
    void matchedProposalCannotBeEditedOrWithdrawnAndCsrfRemainsRequired() throws Exception {
        Session learner = account("immutable-learner");
        String requestId = createOpenRequest(learner, "immutable");
        Session developer = developer("immutable-dev");
        String proposalId = submit(developer, requestId);
        mockMvc.perform(post("/api/v1/me/learning-requests/{id}/match", requestId).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"proposalId\":\"" + proposalId + "\"}"))
            .andExpect(status().isUnauthorized());
        select(learner, requestId, proposalId).andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/proposals/{id}", proposalId).with(csrf()).cookie(developer.cookie())
                .contentType(MediaType.APPLICATION_JSON).content(proposalBody()))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("proposal_locked_after_match"));
        mockMvc.perform(post("/api/v1/proposals/{id}/withdraw", proposalId).with(csrf()).cookie(developer.cookie()))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("proposal_locked_after_match"));
        mockMvc.perform(post("/api/v1/me/learning-requests/{id}/match", requestId).cookie(learner.cookie())
                .contentType(MediaType.APPLICATION_JSON).content("{\"proposalId\":\"" + proposalId + "\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void oneAccountCanLearnOnOneRequestAndTeachOnAnother() throws Exception {
        Session dualRole = developer("dual-role");
        createOpenRequest(dualRole, "dual-role-owned");
        Session secondLearner = account("dual-role-second-learner");
        String secondRequest = createOpenRequest(secondLearner, "dual-role-teaching");
        String proposal = submit(dualRole, secondRequest);
        select(secondLearner, secondRequest, proposal).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/me/matches").cookie(dualRole.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].learningRequestId").value(secondRequest));
    }

    @Test
    void databaseRejectsMatchWithMismatchedRequestAndSelectedProposal() throws Exception {
        Session learner = account("constraint-learner");
        String firstRequest = createOpenRequest(learner, "constraint-one");
        String secondRequest = createOpenRequest(learner, "constraint-two");
        String proposal = submit(developer("constraint-dev"), firstRequest);
        UUID learnerId = UUID.fromString(jdbc.queryForObject("select learner_id from learning_requests where id=?::uuid", String.class, secondRequest));
        UUID developerId = UUID.fromString(jdbc.queryForObject("select developer_profile_id from teaching_proposals where id=?::uuid", String.class, proposal));
        assertThatThrownBy(() -> jdbc.update("""
            insert into matches(id, learning_request_id, selected_proposal_id, learner_id, developer_profile_id, status)
            values (?::uuid, ?::uuid, ?::uuid, ?::uuid, ?::uuid, 'CONFIRMED')
            """, UUID.randomUUID(), secondRequest, proposal, learnerId, developerId))
            .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        assertThat(jdbc.queryForObject("select count(*) from matches where learning_request_id=?::uuid", Integer.class, secondRequest)).isZero();
        assertThat(jdbc.queryForObject("select status from learning_requests where id=?::uuid", String.class, secondRequest)).isEqualTo("OPEN");
    }

    private Session account(String prefix) throws Exception {
        String email = prefix + "-" + UUID.randomUUID() + "@example.test";
        String password = "Correct-Horse-83!";
        mockMvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"displayName\":\"Account " + prefix + "\"}"))
            .andExpect(status().isCreated());
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
            .andExpect(status().isOk()).andReturn();
        return new Session(email, login.getResponse().getCookie("CMSESSION"));
    }

    private Session developer(String prefix) throws Exception {
        Session session = account(prefix);
        String skillId = jdbc.queryForObject("select id from skills where slug='react'", String.class);
        String body = """
            {"headline":"Developer %s","biography":"I teach practical software development with clear examples.",
             "yearsExperience":5,"githubUrl":null,"linkedinUrl":null,"portfolioUrl":null,
             "teachingApproach":"We build small examples and practice each concept.","availability":"Evenings",
             "skillIds":["%s"]}
            """.formatted(prefix, skillId);
        mockMvc.perform(post("/api/v1/developers/me").with(csrf()).cookie(session.cookie())
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());
        return session;
    }

    private String createOpenRequest(Session learner, String label) throws Exception {
        String skillId = jdbc.queryForObject("select id from skills where slug='react'", String.class);
        String body = """
            {"title":"Learning request %s","description":"I want to learn by building a small practical project.",
             "learningGoal":"Build a small application and understand how its parts work.","currentLevel":"BASIC",
             "preferredFormat":"ONLINE","city":null,"budgetMin":null,"budgetMax":null,"budgetUnit":null,
             "preferredSchedule":"Weekday evenings","expectedDuration":"Four weeks",
             "teachingExpectations":"Explain concepts and practice with examples.","requiresCv":false,"skillIds":["%s"]}
            """.formatted(label, skillId);
        MvcResult created = mockMvc.perform(post("/api/v1/learning-requests").with(csrf()).cookie(learner.cookie())
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated()).andReturn();
        String requestId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asText();
        mockMvc.perform(post("/api/v1/learning-requests/{id}/publish", requestId).with(csrf()).cookie(learner.cookie()))
            .andExpect(status().isOk());
        return requestId;
    }

    private String submit(Session developer, String requestId) throws Exception {
        MvcResult submitted = mockMvc.perform(post("/api/v1/learning-requests/{id}/proposals", requestId).with(csrf())
                .cookie(developer.cookie()).contentType(MediaType.APPLICATION_JSON).content(proposalBody()))
            .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(submitted.getResponse().getContentAsString()).get("id").asText();
    }

    private org.springframework.test.web.servlet.ResultActions select(Session learner, String requestId, String proposalId) throws Exception {
        return mockMvc.perform(post("/api/v1/me/learning-requests/{id}/match", requestId).with(csrf()).cookie(learner.cookie())
            .contentType(MediaType.APPLICATION_JSON).content("{\"proposalId\":\"" + proposalId + "\"}"));
    }

    private String proposalBody() {
        return """
            {"introduction":"I can help you make steady progress through a practical project.",
             "teachingApproach":"We will break the goal into small steps and practice with working code.",
             "relevantExperience":"I have built and taught several small web applications.",
             "proposedRate":200000,"rateUnit":"PER_SESSION","proposedSchedule":"Tuesday evenings",
             "estimatedDuration":"Four weekly sessions","cvId":null,"removeCv":false}
            """;
    }

    private record Session(String email, Cookie cookie) {}
}
