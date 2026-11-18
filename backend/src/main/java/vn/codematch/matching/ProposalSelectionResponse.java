package vn.codematch.matching;

import vn.codematch.proposals.ProposalStatus;
import vn.codematch.requests.LearningRequestStatus;

import java.util.UUID;

public record ProposalSelectionResponse(UUID learningRequestId, LearningRequestStatus requestStatus,
                                        ProposalStatus proposalStatus, ProposalSelectionStatus selectionStatus) {}
