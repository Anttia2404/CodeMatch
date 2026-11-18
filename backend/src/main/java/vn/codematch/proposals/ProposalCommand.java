package vn.codematch.proposals;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import vn.codematch.requests.BudgetUnit;

import java.util.UUID;

public record ProposalCommand(
    @NotBlank @Size(min = 30, max = 3000) String introduction,
    @NotBlank @Size(min = 20, max = 3000) String teachingApproach,
    @NotBlank @Size(min = 20, max = 2000) String relevantExperience,
    @NotNull @Positive Long proposedRate,
    @NotNull BudgetUnit rateUnit,
    @NotBlank @Size(max = 500) String proposedSchedule,
    @NotBlank @Size(max = 120) String estimatedDuration,
    UUID cvId,
    boolean removeCv
) {}
