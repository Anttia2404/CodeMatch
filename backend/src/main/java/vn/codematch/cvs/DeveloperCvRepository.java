package vn.codematch.cvs;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeveloperCvRepository extends JpaRepository<DeveloperCv, UUID> {
    List<DeveloperCv> findAllByDeveloperProfileIdOrderByCreatedAtDesc(UUID developerProfileId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select cv from DeveloperCv cv where cv.id = :id")
    Optional<DeveloperCv> findLockedById(@Param("id") UUID id);
}
