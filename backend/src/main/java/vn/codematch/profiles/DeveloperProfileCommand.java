package vn.codematch.profiles;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record DeveloperProfileCommand(
    @NotBlank @Size(max = 120) String headline,
    @NotBlank @Size(max = 3000) String biography,
    @NotNull @Min(0) @Max(60) Integer yearsExperience,
    @Pattern(regexp = "^$|^https://[^\\s]{1,246}$") String githubUrl,
    @Pattern(regexp = "^$|^https://[^\\s]{1,246}$") String linkedinUrl,
    @Pattern(regexp = "^$|^https://[^\\s]{1,246}$") String portfolioUrl,
    @NotBlank @Size(max = 2000) String teachingApproach,
    @NotBlank @Size(max = 500) String availability,
    @NotEmpty @Size(max = 20) List<UUID> skillIds
) {
    public DeveloperProfileCommand {
        githubUrl = normalizeUrl(githubUrl);
        linkedinUrl = normalizeUrl(linkedinUrl);
        portfolioUrl = normalizeUrl(portfolioUrl);
    }

    private static String normalizeUrl(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
