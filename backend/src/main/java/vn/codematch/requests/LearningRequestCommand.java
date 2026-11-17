package vn.codematch.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record LearningRequestCommand(
    @NotBlank @Size(min = 8, max = 140) String title,
    @NotBlank @Size(min = 30, max = 3000) String description,
    @NotBlank @Size(min = 10, max = 2000) String learningGoal,
    @NotNull LearningLevel currentLevel,
    @NotNull LearningFormat preferredFormat,
    @Size(max = 100) String city,
    @PositiveOrZero Long budgetMin,
    @PositiveOrZero Long budgetMax,
    BudgetUnit budgetUnit,
    @NotBlank @Size(max = 500) String preferredSchedule,
    @NotBlank @Size(max = 120) String expectedDuration,
    @NotBlank @Size(min = 8, max = 1000) String teachingExpectations,
    boolean requiresCv,
    @NotNull @Size(min = 1, max = 10) List<@NotNull UUID> skillIds
) {}
