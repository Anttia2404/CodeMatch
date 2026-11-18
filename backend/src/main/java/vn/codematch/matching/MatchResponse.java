package vn.codematch.matching;

import vn.codematch.proposals.DeveloperApplicantSummary;
import vn.codematch.proposals.ProposalResponse;

import java.time.Instant;
import java.util.UUID;

public record MatchResponse(UUID id, UUID learningRequestId, String learningRequestTitle,
                            String learnerDisplayName, UUID selectedProposalId,
                            DeveloperApplicantSummary developer, ProposalResponse proposal,
                            MatchStatus status, Instant createdAt, Instant updatedAt) {
    static MatchResponse from(Match match) {
        return new MatchResponse(match.getId(), match.getLearningRequest().getId(),
            match.getLearningRequest().getTitle(), match.getLearner().getDisplayName(),
            match.getSelectedProposal().getId(), DeveloperApplicantSummary.from(match.getDeveloperProfile()),
            ProposalResponse.from(match.getSelectedProposal()), match.getStatus(), match.getCreatedAt(), match.getUpdatedAt());
    }
}
