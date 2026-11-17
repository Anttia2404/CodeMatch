package vn.codematch.profiles;

import java.util.UUID;

public record SkillResponse(UUID id, String slug, String name) {
    public static SkillResponse from(Skill skill) {
        return new SkillResponse(skill.getId(), skill.getSlug(), skill.getName());
    }
}
