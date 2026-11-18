package vn.codematch.proposals;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeachingProposalRepository extends JpaRepository<TeachingProposal, UUID> {
    boolean existsByLearningRequestIdAndDeveloperProfileIdAndStatus(
        UUID learningRequestId, UUID developerProfileId, ProposalStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select proposal from TeachingProposal proposal where proposal.id = :id")
    Optional<TeachingProposal> findLockedById(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"learningRequest", "developerProfile", "developerProfile.owner", "developerProfile.skills", "cv"})
    List<TeachingProposal> findAllByDeveloperProfileIdOrderByUpdatedAtDesc(UUID developerProfileId);

    @EntityGraph(attributePaths = {"learningRequest", "developerProfile", "developerProfile.owner", "developerProfile.skills", "cv"})
    List<TeachingProposal> findAllByLearningRequestIdOrderByCreatedAtDesc(UUID learningRequestId);

    @EntityGraph(attributePaths = {"learningRequest", "learningRequest.learner", "developerProfile", "developerProfile.owner", "developerProfile.skills", "cv"})
    Optional<TeachingProposal> findWithDetailsById(UUID id);
}
