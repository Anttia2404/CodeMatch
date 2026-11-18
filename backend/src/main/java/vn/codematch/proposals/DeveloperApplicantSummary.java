package vn.codematch.proposals;

import vn.codematch.profiles.DeveloperProfile;
import vn.codematch.profiles.SkillResponse;

import java.util.List;
import java.util.UUID;

public record DeveloperApplicantSummary(
    UUID profileId,
    String displayName,
    String headline,
    String biography,
    int yearsExperience,
    List<SkillResponse> skills
) {
    public static DeveloperApplicantSummary from(DeveloperProfile profile) {
        return new DeveloperApplicantSummary(profile.getId(), profile.getOwner().getDisplayName(), profile.getHeadline(),
            profile.getBiography(), profile.getYearsExperience(), profile.getSkills().stream().map(SkillResponse::from).toList());
    }
}
