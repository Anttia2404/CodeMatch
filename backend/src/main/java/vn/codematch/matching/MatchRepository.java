package vn.codematch.matching;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MatchRepository extends JpaRepository<Match, UUID> {
    @EntityGraph(attributePaths = {"learningRequest", "learner", "selectedProposal", "selectedProposal.developerProfile",
        "selectedProposal.developerProfile.owner", "selectedProposal.developerProfile.skills"})
    Optional<Match> findWithDetailsByLearningRequestId(UUID learningRequestId);

    @EntityGraph(attributePaths = {"learningRequest", "learner", "selectedProposal", "selectedProposal.developerProfile",
        "selectedProposal.developerProfile.owner", "selectedProposal.developerProfile.skills"})
    List<Match> findAllWithDetailsByDeveloperProfileIdOrderByCreatedAtDesc(UUID developerProfileId);

    Optional<Match> findByLearningRequestId(UUID learningRequestId);
}
