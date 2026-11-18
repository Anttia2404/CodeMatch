package vn.codematch.requests;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface LearningRequestRepository extends JpaRepository<LearningRequest, UUID>, JpaSpecificationExecutor<LearningRequest> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from LearningRequest request where request.id = :id")
    Optional<LearningRequest> findLockedById(@Param("id") UUID id);

    @EntityGraph(attributePaths = "skills")
    Optional<LearningRequest> findWithSkillsById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from LearningRequest request where request.id = :id")
    Optional<LearningRequest> findLockedWithSkillsById(@Param("id") UUID id);

    Page<LearningRequest> findAllByLearnerId(UUID learnerId, Pageable pageable);

    Page<LearningRequest> findAllByLearnerIdAndStatus(UUID learnerId, LearningRequestStatus status, Pageable pageable);
}
