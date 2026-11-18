package vn.codematch.cvs;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import vn.codematch.profiles.DeveloperProfile;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "developer_cvs")
public class DeveloperCv {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "developer_profile_id", nullable = false)
    private DeveloperProfile developerProfile;

    @Column(name = "storage_key", nullable = false, unique = true)
    private UUID storageKey;

    @Column(name = "original_name", nullable = false, length = 180)
    private String originalName;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "media_type", nullable = false, length = 50)
    private String mediaType = "application/pdf";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected DeveloperCv() {}

    public DeveloperCv(UUID id, DeveloperProfile developerProfile, UUID storageKey, String originalName, long sizeBytes) {
        this.id = id;
        this.developerProfile = developerProfile;
        this.storageKey = storageKey;
        this.originalName = originalName;
        this.sizeBytes = sizeBytes;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void replace(UUID newStorageKey, String newOriginalName, long newSizeBytes) {
        this.storageKey = newStorageKey;
        this.originalName = newOriginalName;
        this.sizeBytes = newSizeBytes;
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    void beforeUpdate() { this.updatedAt = Instant.now(); }

    public UUID getId() { return id; }
    public DeveloperProfile getDeveloperProfile() { return developerProfile; }
    UUID getStorageKey() { return storageKey; }
    public String getOriginalName() { return originalName; }
    public long getSizeBytes() { return sizeBytes; }
    public String getMediaType() { return mediaType; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
