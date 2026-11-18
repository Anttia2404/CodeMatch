package vn.codematch.matching;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SelectProposalRequest(@NotNull UUID proposalId) {}
