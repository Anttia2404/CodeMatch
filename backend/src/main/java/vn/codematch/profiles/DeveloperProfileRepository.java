package vn.codematch.profiles;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DeveloperProfileRepository extends JpaRepository<DeveloperProfile, UUID> {
    @EntityGraph(attributePaths = {"owner", "skills"})
    Optional<DeveloperProfile> findWithOwnerAndSkillsById(UUID id);

    @EntityGraph(attributePaths = {"owner", "skills"})
    Optional<DeveloperProfile> findWithOwnerAndSkillsByOwnerId(UUID ownerId);

    @EntityGraph(attributePaths = {"owner", "skills"})
    Optional<DeveloperProfile> findWithOwnerAndSkillsByOwnerEmailIgnoreCase(String email);

    boolean existsByOwnerId(UUID ownerId);
}
