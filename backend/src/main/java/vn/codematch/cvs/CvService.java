package vn.codematch.cvs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import vn.codematch.api.ApiException;
import vn.codematch.profiles.DeveloperProfile;
import vn.codematch.profiles.DeveloperProfileRepository;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class CvService {
    private static final Logger log = LoggerFactory.getLogger(CvService.class);
    private final DeveloperProfileRepository profiles;
    private final DeveloperCvRepository cvs;
    private final PrivateCvStorage storage;
    private final JdbcTemplate jdbcTemplate;

    public CvService(DeveloperProfileRepository profiles, DeveloperCvRepository cvs, PrivateCvStorage storage,
                     JdbcTemplate jdbcTemplate) {
        this.profiles = profiles;
        this.cvs = cvs;
        this.storage = storage;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<DeveloperCvResponse> list(String email) {
        DeveloperProfile profile = profile(email);
        return cvs.findAllByDeveloperProfileIdOrderByCreatedAtDesc(profile.getId()).stream()
            .map(DeveloperCvResponse::from).toList();
    }

    @Transactional
    public DeveloperCvResponse upload(String email, MultipartFile file) {
        DeveloperProfile profile = profile(email);
        ValidatedFile validated = validate(file);
        UUID key = store(validated.content());
        DeveloperCv cv = new DeveloperCv(UUID.randomUUID(), profile, key, validated.fileName(), validated.content().length);
        try {
            deleteOnRollback(key);
            DeveloperCv saved = cvs.saveAndFlush(cv);
            return DeveloperCvResponse.from(saved);
        } catch (DataIntegrityViolationException exception) {
            deleteQuietly(key);
            throw ApiException.conflict("cv_conflict", "Không thể lưu tệp CV này.");
        }
    }

    @Transactional
    public DeveloperCvResponse replace(String email, UUID id, MultipartFile file) {
        DeveloperProfile profile = profile(email);
        DeveloperCv cv = ownedLocked(id, profile);
        ValidatedFile validated = validate(file);
        UUID newKey = store(validated.content());
        UUID oldKey = cv.getStorageKey();
        try {
            cv.replace(newKey, validated.fileName(), validated.content().length);
            DeveloperCv saved = cvs.saveAndFlush(cv);
            cleanupAfterCommit(newKey, oldKey);
            return DeveloperCvResponse.from(saved);
        } catch (RuntimeException exception) {
            deleteQuietly(newKey);
            throw exception;
        }
    }

    @Transactional
    public void delete(String email, UUID id) {
        DeveloperProfile profile = profile(email);
        DeveloperCv cv = ownedLocked(id, profile);
        Boolean referencedBySubmittedProposal = jdbcTemplate.queryForObject(
            "select exists (select 1 from teaching_proposals where cv_id = ? and status = 'SUBMITTED')",
            Boolean.class, id);
        if (Boolean.TRUE.equals(referencedBySubmittedProposal)) {
            throw ApiException.conflict("cv_in_active_proposal", "Rút hồ sơ ứng tuyển trước khi xóa CV đang được đính kèm.");
        }
        UUID storageKey = cv.getStorageKey();
        cvs.delete(cv);
        cvs.flush();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { deleteQuietly(storageKey); }
        });
    }

    @Transactional(readOnly = true)
    public CvDownload downloadOwned(String email, UUID id) {
        DeveloperProfile profile = profiles.findWithOwnerAndSkillsByOwnerEmailIgnoreCase(email)
            .orElseThrow(ApiException::notFound);
        DeveloperCv cv = owned(id, profile);
        return download(cv);
    }

    @Transactional(readOnly = true)
    public CvDownload downloadAttached(DeveloperCv cv) {
        return download(cv);
    }

    @Transactional
    public DeveloperCv resolveForProposal(String email, DeveloperProfile profile, UUID cvId) {
        if (cvId == null) return null;
        DeveloperCv cv = cvs.findLockedById(cvId).orElseThrow(ApiException::notFound);
        if (!cv.getDeveloperProfile().getId().equals(profile.getId())
                || !cv.getDeveloperProfile().getOwner().getEmail().equalsIgnoreCase(email)) {
            throw ApiException.notFound();
        }
        return cv;
    }

    private DeveloperProfile profile(String email) {
        return profiles.findWithOwnerAndSkillsByOwnerEmailIgnoreCase(email)
            .orElseThrow(() -> ApiException.conflict("developer_profile_required", "Tạo hồ sơ developer trước khi quản lý CV."));
    }

    private DeveloperCv owned(UUID id, DeveloperProfile profile) {
        DeveloperCv cv = cvs.findById(id).orElseThrow(ApiException::notFound);
        if (!cv.getDeveloperProfile().getId().equals(profile.getId())) throw ApiException.notFound();
        return cv;
    }

    private DeveloperCv ownedLocked(UUID id, DeveloperProfile profile) {
        DeveloperCv cv = cvs.findLockedById(id).orElseThrow(ApiException::notFound);
        if (!cv.getDeveloperProfile().getId().equals(profile.getId())) throw ApiException.notFound();
        return cv;
    }

    private CvDownload download(DeveloperCv cv) {
        try {
            return new CvDownload(cv.getOriginalName(), storage.read(cv.getStorageKey()));
        } catch (IOException exception) {
            log.warn("Private CV object could not be read.");
            throw new IllegalStateException("Private CV object is unavailable.");
        }
    }

    private ValidatedFile validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("Chọn một tệp PDF để tải lên.");
        if (file.getSize() > PdfContentValidator.MAX_SIZE_BYTES) {
            throw ApiException.badRequest("Tệp PDF không được lớn hơn 5 MB.");
        }
        try {
            byte[] content = file.getBytes();
            return new ValidatedFile(content, PdfContentValidator.validate(content, file.getOriginalFilename()));
        } catch (IOException exception) {
            throw ApiException.badRequest("Không thể đọc tệp CV đã chọn.");
        }
    }

    private UUID store(byte[] content) {
        try {
            return storage.store(content);
        } catch (IOException exception) {
            log.error("Private CV storage operation failed.");
            throw new IllegalStateException("Không thể lưu tệp CV.");
        }
    }

    private void deleteOnRollback(UUID key) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) deleteQuietly(key);
            }
        });
    }

    private void cleanupAfterCommit(UUID newKey, UUID oldKey) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { deleteQuietly(oldKey); }
            @Override public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) deleteQuietly(newKey);
            }
        });
    }

    private void deleteQuietly(UUID key) {
        try {
            storage.delete(key);
        } catch (IOException exception) {
            log.warn("Private CV cleanup will require storage maintenance.");
        }
    }

    private record ValidatedFile(byte[] content, String fileName) {}
}
