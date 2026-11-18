package vn.codematch.moderation;

import java.time.Instant;
import java.util.UUID;

public record ModerationReportResponse(UUID id, UUID reporterId, ReportTargetType targetType, UUID targetId,
        ReportReason reason, String description, ReportStatus status, Instant createdAt, Instant reviewedAt) {}
