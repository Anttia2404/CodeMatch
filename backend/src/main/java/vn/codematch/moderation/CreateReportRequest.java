package vn.codematch.moderation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateReportRequest(@NotNull ReportTargetType targetType, @NotNull UUID targetId,
                                  @NotNull ReportReason reason, @Size(max = 1000) String description) {}
