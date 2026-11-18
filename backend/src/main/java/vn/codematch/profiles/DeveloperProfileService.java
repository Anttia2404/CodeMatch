package vn.codematch.profiles;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codematch.api.ApiException;
import vn.codematch.identity.User;
import vn.codematch.identity.UserRepository;
import vn.codematch.foundation.PilotMetrics;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class DeveloperProfileService {
    private final DeveloperProfileRepository profiles;
    private final SkillRepository skills;
    private final UserRepository users;
    private final PilotMetrics metrics;

    public DeveloperProfileService(DeveloperProfileRepository profiles, SkillRepository skills,
                                   UserRepository users, PilotMetrics metrics) {
        this.profiles = profiles;
        this.skills = skills;
        this.users = users;
        this.metrics = metrics;
    }

    @Transactional
    public DeveloperProfileResponse create(String ownerEmail, DeveloperProfileCommand command) {
        User owner = findOwner(ownerEmail);
        if (profiles.existsByOwnerId(owner.getId())) {
            throw ApiException.conflict("profile_exists", "Tài khoản đã có hồ sơ developer.");
        }
        Set<Skill> selectedSkills = resolveSkills(command.skillIds());
        DeveloperProfile profile = new DeveloperProfile(UUID.randomUUID(), owner, command, selectedSkills);
        DeveloperProfileResponse created = DeveloperProfileResponse.from(profiles.save(profile));
        metrics.record("developer.profile.completed");
        return created;
    }

    @Transactional
    public DeveloperProfileResponse update(String ownerEmail, DeveloperProfileCommand command) {
        User owner = findOwner(ownerEmail);
        DeveloperProfile profile = profiles.findWithOwnerAndSkillsByOwnerId(owner.getId())
            .orElseThrow(ApiException::notFound);
        profile.update(command, resolveSkills(command.skillIds()));
        return DeveloperProfileResponse.from(profile);
    }

    @Transactional(readOnly = true)
    public DeveloperProfileResponse getPublic(UUID profileId) {
        return profiles.findWithOwnerAndSkillsById(profileId)
            .map(DeveloperProfileResponse::from)
            .orElseThrow(ApiException::notFound);
    }

    @Transactional(readOnly = true)
    public DeveloperProfileResponse getMine(String ownerEmail) {
        User owner = findOwner(ownerEmail);
        return profiles.findWithOwnerAndSkillsByOwnerId(owner.getId())
            .map(DeveloperProfileResponse::from)
            .orElseThrow(ApiException::notFound);
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> listSkills() {
        return skills.findAllByOrderByNameAsc().stream().map(SkillResponse::from).toList();
    }

    private User findOwner(String email) {
        return users.findByEmailIgnoreCase(email).orElseThrow(ApiException::notFound);
    }

    private Set<Skill> resolveSkills(List<UUID> ids) {
        Set<UUID> uniqueIds = new HashSet<>(ids);
        if (uniqueIds.size() != ids.size()) {
            throw ApiException.badRequest("Không chọn lặp lại cùng một kỹ năng.");
        }
        List<Skill> found = skills.findAllById(uniqueIds);
        if (found.size() != uniqueIds.size()) {
            throw ApiException.badRequest("Có kỹ năng không nằm trong danh mục hiện có.");
        }
        return new HashSet<>(found);
    }
}
