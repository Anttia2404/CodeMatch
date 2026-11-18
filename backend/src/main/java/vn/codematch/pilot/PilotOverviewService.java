package vn.codematch.pilot;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PilotOverviewService {
    private static final String OVERVIEW_SQL = """
        WITH published_requests AS (
            SELECT lr.id, lr.published_at,
                (SELECT MIN(p.created_at) FROM teaching_proposals p WHERE p.learning_request_id = lr.id) AS first_proposal_at,
                (SELECT MIN(m.created_at) FROM matches m WHERE m.learning_request_id = lr.id) AS matched_at
            FROM learning_requests lr
            WHERE lr.published_at IS NOT NULL
        ), funnel AS (
            SELECT COUNT(*) AS published_count,
                COUNT(*) FILTER (WHERE first_proposal_at IS NOT NULL) AS with_proposal_count,
                COUNT(*) FILTER (WHERE matched_at IS NOT NULL) AS matched_count,
                COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (first_proposal_at - published_at)) / 60)::numeric, 1), 0)::double precision AS avg_first_proposal_minutes,
                COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (matched_at - published_at)) / 60)::numeric, 1), 0)::double precision AS avg_match_minutes
            FROM published_requests
        )
        SELECT
            (SELECT COUNT(*) FROM users) AS registered_users,
            (SELECT COUNT(*) FROM developer_profiles p JOIN users u ON u.id = p.user_id WHERE u.account_status = 'ACTIVE') AS active_developers,
            (SELECT COUNT(*) FROM learning_requests WHERE status = 'OPEN') AS open_requests,
            (SELECT COUNT(*) FROM teaching_proposals WHERE status = 'SUBMITTED') AS submitted_proposals,
            (SELECT COUNT(*) FROM matches WHERE status = 'CONFIRMED') AS confirmed_matches,
            (SELECT COUNT(*) FROM moderation_reports WHERE status = 'OPEN') AS pending_reports,
            funnel.published_count,
            funnel.with_proposal_count,
            funnel.matched_count,
            CASE WHEN funnel.published_count = 0 THEN 0
                ELSE ROUND(100.0 * funnel.with_proposal_count / funnel.published_count, 1)::double precision END AS proposal_coverage_percent,
            CASE WHEN funnel.published_count = 0 THEN 0
                ELSE ROUND(100.0 * funnel.matched_count / funnel.published_count, 1)::double precision END AS match_conversion_percent,
            funnel.avg_first_proposal_minutes,
            funnel.avg_match_minutes
        FROM funnel
        """;

    private final JdbcTemplate jdbc;

    public PilotOverviewService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public PilotOverviewResponse getOverview() {
        return jdbc.queryForObject(OVERVIEW_SQL, (result, row) -> new PilotOverviewResponse(
            result.getLong("registered_users"),
            result.getLong("active_developers"),
            result.getLong("open_requests"),
            result.getLong("submitted_proposals"),
            result.getLong("confirmed_matches"),
            result.getLong("pending_reports"),
            result.getLong("published_count"),
            result.getLong("with_proposal_count"),
            result.getLong("matched_count"),
            result.getDouble("proposal_coverage_percent"),
            result.getDouble("match_conversion_percent"),
            result.getDouble("avg_first_proposal_minutes"),
            result.getDouble("avg_match_minutes")
        ));
    }
}
