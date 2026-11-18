package vn.codematch.moderation;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codematch.api.ApiException;
import vn.codematch.audit.AuditEventService;
import vn.codematch.identity.User;
import vn.codematch.identity.UserRepository;
import vn.codematch.profiles.DeveloperProfileRepository;
import vn.codematch.proposals.TeachingProposalRepository;
import vn.codematch.requests.LearningRequestRepository;
import vn.codematch.requests.LearningRequestStatus;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ModerationService {
    private static final RowMapper<ModerationReportResponse> REPORT_MAPPER = ModerationService::toReport;
    private final JdbcTemplate jdbc;
    private final UserRepository users;
    private final LearningRequestRepository requests;
    private final DeveloperProfileRepository profiles;
    private final TeachingProposalRepository proposals;
    private final AuditEventService audit;

    public ModerationService(JdbcTemplate jdbc, UserRepository users, LearningRequestRepository requests,
            DeveloperProfileRepository profiles, TeachingProposalRepository proposals, AuditEventService audit) {
        this.jdbc = jdbc;
        this.users = users;
        this.requests = requests;
        this.profiles = profiles;
        this.proposals = proposals;
        this.audit = audit;
    }

    @Transactional
    public ModerationReportResponse create(String email, CreateReportRequest input) {
        User reporter = user(email);
        validateVisibleTarget(email, input.targetType(), input.targetId());
        try {
            UUID id = UUID.randomUUID();
            jdbc.update("insert into moderation_reports (id, reporter_id, target_type, target_id, reason, description) values (?, ?, ?, ?, ?, ?)",
                id, reporter.getId(), input.targetType().name(), input.targetId(), input.reason().name(), clean(input.description()));
            return findReport(id);
        } catch (DataIntegrityViolationException ex) {
            throw ApiException.conflict("duplicate_report", "Bạn đã gửi báo cáo cho nội dung này.");
        }
    }

    @Transactional(readOnly = true)
    public List<ModerationReportResponse> mine(String email) {
        User reporter = user(email);
        return jdbc.query("select * from moderation_reports where reporter_id = ? order by created_at desc", REPORT_MAPPER, reporter.getId());
    }

    @Transactional(readOnly = true)
    public List<ModerationReportResponse> queue(ReportStatus status) {
        if (status == null) return jdbc.query("select * from moderation_reports order by created_at asc limit 100", REPORT_MAPPER);
        return jdbc.query("select * from moderation_reports where status = ? order by created_at asc limit 100", REPORT_MAPPER, status.name());
    }

    @Transactional(readOnly = true)
    public ModerationReportResponse report(UUID id) { return findReport(id); }

    @Transactional
    public ModerationReportResponse review(UUID adminId, UUID id, ReportStatus status) {
        if (status == null || status == ReportStatus.OPEN) throw ApiException.badRequest("Chọn trạng thái đã xử lý hoặc từ chối.");
        int updated = jdbc.update("update moderation_reports set status = ?, reviewed_at = CURRENT_TIMESTAMP, reviewer_id = ? where id = ? and status = 'OPEN'",
            status.name(), adminId, id);
        if (updated == 0) throw ApiException.conflict("report_already_reviewed", "Báo cáo không còn ở trạng thái chờ xử lý.");
        audit.record(adminId, "MODERATION_REPORT_" + status.name(), "REPORT", id, true);
        return findReport(id);
    }

    @Transactional
    public void hideRequest(UUID adminId, UUID requestId, boolean hidden) {
        var request = requests.findLockedById(requestId).orElseThrow(ApiException::notFound);
        request.setHidden(hidden);
        audit.record(adminId, hidden ? "LEARNING_REQUEST_HIDDEN" : "LEARNING_REQUEST_RESTORED",
            "LEARNING_REQUEST", requestId, true);
    }

    @Transactional
    public void suspendAccount(UUID adminId, UUID userId) {
        User target = users.findById(userId).orElseThrow(ApiException::notFound);
        if (adminId.equals(userId)) throw ApiException.badRequest("Không thể tự đình chỉ tài khoản quản trị viên đang đăng nhập.");
        target.suspend();
        jdbc.update("delete from spring_session where principal_name = ?", target.getEmail());
        audit.record(adminId, "ACCOUNT_SUSPENDED", "USER", userId, true);
    }

    private void validateVisibleTarget(String email, ReportTargetType type, UUID id) {
        switch (type) {
            case LEARNING_REQUEST -> {
                var target = requests.findById(id).orElseThrow(ApiException::notFound);
                if (target.getStatus() != LearningRequestStatus.OPEN || target.getHiddenAt() != null
                        || target.getLearner().getEmail().equalsIgnoreCase(email)) throw ApiException.notFound();
            }
            case DEVELOPER_PROFILE -> {
                var target = profiles.findWithOwnerAndSkillsById(id).orElseThrow(ApiException::notFound);
                if (target.getOwner().getEmail().equalsIgnoreCase(email)) throw ApiException.notFound();
            }
            case TEACHING_PROPOSAL -> {
                var target = proposals.findWithDetailsById(id).orElseThrow(ApiException::notFound);
                boolean learner = target.getLearningRequest().getLearner().getEmail().equalsIgnoreCase(email);
                boolean developer = target.getDeveloperProfile().getOwner().getEmail().equalsIgnoreCase(email);
                if ((!learner && !developer) || (learner && developer)) throw ApiException.notFound();
            }
        }
    }

    private ModerationReportResponse findReport(UUID id) {
        return jdbc.query("select * from moderation_reports where id = ?", REPORT_MAPPER, id).stream()
            .findFirst().orElseThrow(ApiException::notFound);
    }

    private User user(String email) { return users.findByEmailIgnoreCase(email).orElseThrow(ApiException::notFound); }

    private String clean(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }

    private static ModerationReportResponse toReport(ResultSet rs, int row) throws SQLException {
        return new ModerationReportResponse(rs.getObject("id", UUID.class), rs.getObject("reporter_id", UUID.class),
            ReportTargetType.valueOf(rs.getString("target_type")), rs.getObject("target_id", UUID.class),
            ReportReason.valueOf(rs.getString("reason")), rs.getString("description"), ReportStatus.valueOf(rs.getString("status")),
            rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("reviewed_at") == null ? null : rs.getTimestamp("reviewed_at").toInstant());
    }
}
