package vn.codematch.requests;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface LearningRequestRepository extends JpaRepository<LearningRequest, UUID>, JpaSpecificationExecutor<LearningRequest> {
    @EntityGraph(attributePaths = "skills")
    Optional<LearningRequest> findWithSkillsById(UUID id);

    Page<LearningRequest> findAllByLearnerId(UUID learnerId, Pageable pageable);

    Page<LearningRequest> findAllByLearnerIdAndStatus(UUID learnerId, LearningRequestStatus status, Pageable pageable);
}
