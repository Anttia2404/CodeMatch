package vn.codematch.requests;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavedRequestRepository extends JpaRepository<SavedRequest, UUID> {
    boolean existsByUserIdAndLearningRequestId(UUID userId, UUID learningRequestId);
    void deleteByUserIdAndLearningRequestId(UUID userId, UUID learningRequestId);
    @EntityGraph(attributePaths = {"learningRequest", "learningRequest.skills"})
    List<SavedRequest> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    List<SavedRequest> findAllByUserIdAndLearningRequestHiddenAtIsNullOrderByCreatedAtDesc(UUID userId);
}
