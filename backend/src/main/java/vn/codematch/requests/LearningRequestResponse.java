package vn.codematch.requests;

import vn.codematch.profiles.SkillResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record LearningRequestResponse(
    UUID id,
    String title,
    String description,
    String learningGoal,
    LearningLevel currentLevel,
    LearningFormat preferredFormat,
    String city,
    Long budgetMin,
    Long budgetMax,
    BudgetUnit budgetUnit,
    String currency,
    String preferredSchedule,
    String expectedDuration,
    String teachingExpectations,
    boolean requiresCv,
    LearningRequestStatus status,
    List<SkillResponse> skills,
    Instant createdAt,
    Instant updatedAt,
    Instant publishedAt,
    Instant closedAt
) {
    public static LearningRequestResponse from(LearningRequest request) {
        return new LearningRequestResponse(request.getId(), request.getTitle(), request.getDescription(),
            request.getLearningGoal(), request.getCurrentLevel(), request.getPreferredFormat(), request.getCity(),
            request.getBudgetMin(), request.getBudgetMax(), request.getBudgetUnit(), "VND",
            request.getPreferredSchedule(), request.getExpectedDuration(), request.getTeachingExpectations(),
            request.isRequiresCv(), request.getStatus(), request.getSkills().stream().map(SkillResponse::from).toList(),
            request.getCreatedAt(), request.getUpdatedAt(), request.getPublishedAt(), request.getClosedAt());
    }
}
