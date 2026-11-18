package vn.codematch.pilot;

public record PilotOverviewResponse(
    long totalRegisteredUsers,
    long activeDevelopers,
    long openLearningRequests,
    long submittedProposals,
    long confirmedMatches,
    long pendingModerationReports,
    long publishedLearningRequests,
    long requestsWithAtLeastOneProposal,
    long matchedLearningRequests,
    double requestProposalCoveragePercent,
    double requestMatchConversionPercent,
    double averageMinutesToFirstProposal,
    double averageMinutesToConfirmedMatch
) {}
