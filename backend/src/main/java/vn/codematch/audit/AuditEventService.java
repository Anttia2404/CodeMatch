package vn.codematch.audit;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditEventService {
    private final JdbcTemplate jdbc;

    public AuditEventService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional
    public void record(UUID actor, String event, String targetType, UUID target, boolean success) {
        jdbc.update("insert into audit_events (id, actor_id, event_type, target_type, target_id, outcome) values (?, ?, ?, ?, ?, ?)",
            UUID.randomUUID(), actor, event, targetType, target, success ? "SUCCESS" : "FAILURE");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(UUID actor, String event, String targetType, UUID target) {
        record(actor, event, targetType, target, false);
    }
}
