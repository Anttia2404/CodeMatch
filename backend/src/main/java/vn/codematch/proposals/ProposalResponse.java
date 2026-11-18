package vn.codematch.proposals;

import vn.codematch.requests.BudgetUnit;
import vn.codematch.requests.LearningRequestStatus;

import java.time.Instant;
import java.util.UUID;

public record ProposalResponse(
    UUID id,
    UUID learningRequestId,
    String learningRequestTitle,
    LearningRequestStatus learningRequestStatus,
    DeveloperApplicantSummary developer,
    String introduction,
    String teachingApproach,
    String relevantExperience,
    long proposedRate,
    BudgetUnit rateUnit,
    String currency,
    String proposedSchedule,
    String estimatedDuration,
    boolean hasCv,
    ProposalStatus status,
    Instant createdAt,
    Instant updatedAt,
    Instant withdrawnAt
) {
    public static ProposalResponse from(TeachingProposal proposal) {
        return new ProposalResponse(proposal.getId(), proposal.getLearningRequest().getId(),
            proposal.getLearningRequest().getTitle(), proposal.getLearningRequest().getStatus(),
            DeveloperApplicantSummary.from(proposal.getDeveloperProfile()), proposal.getIntroduction(),
            proposal.getTeachingApproach(), proposal.getRelevantExperience(), proposal.getProposedRate(),
            proposal.getRateUnit(), "VND", proposal.getProposedSchedule(), proposal.getEstimatedDuration(),
            proposal.getCv() != null, proposal.getStatus(), proposal.getCreatedAt(), proposal.getUpdatedAt(),
            proposal.getWithdrawnAt());
    }
}
