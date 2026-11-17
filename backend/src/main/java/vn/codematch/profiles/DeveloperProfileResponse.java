package vn.codematch.profiles;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DeveloperProfileResponse(
    UUID id,
    UUID developerId,
    String displayName,
    String headline,
    String biography,
    int yearsExperience,
    String githubUrl,
    String linkedinUrl,
    String portfolioUrl,
    String teachingApproach,
    String availability,
    List<SkillResponse> skills,
    Instant createdAt,
    Instant updatedAt
) {
    static DeveloperProfileResponse from(DeveloperProfile profile) {
        List<SkillResponse> skills = profile.getSkills().stream()
            .sorted(java.util.Comparator.comparing(Skill::getName))
            .map(SkillResponse::from)
            .toList();
        return new DeveloperProfileResponse(profile.getId(), profile.getOwner().getId(), profile.getOwner().getDisplayName(),
            profile.getHeadline(), profile.getBiography(), profile.getYearsExperience(), profile.getGithubUrl(),
            profile.getLinkedinUrl(), profile.getPortfolioUrl(), profile.getTeachingApproach(), profile.getAvailability(),
            skills, profile.getCreatedAt(), profile.getUpdatedAt());
    }
}
