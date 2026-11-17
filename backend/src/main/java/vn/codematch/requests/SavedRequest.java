package vn.codematch.requests;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import vn.codematch.identity.User;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "saved_requests")
public class SavedRequest {
    @Id
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learning_request_id", nullable = false)
    private LearningRequest learningRequest;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected SavedRequest() {}

    public SavedRequest(User user, LearningRequest learningRequest) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.learningRequest = learningRequest;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public LearningRequest getLearningRequest() { return learningRequest; }
    public Instant getCreatedAt() { return createdAt; }
}
