package vn.codematch.matching;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import vn.codematch.identity.User;
import vn.codematch.profiles.DeveloperProfile;
import vn.codematch.proposals.TeachingProposal;
import vn.codematch.requests.LearningRequest;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "matches")
public class Match {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learning_request_id", nullable = false)
    private LearningRequest learningRequest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "selected_proposal_id", nullable = false)
    private TeachingProposal selectedProposal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_id", nullable = false)
    private User learner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "developer_profile_id", nullable = false)
    private DeveloperProfile developerProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private MatchStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Match() {}

    public Match(UUID id, LearningRequest request, TeachingProposal proposal) {
        this.id = id;
        this.learningRequest = request;
        this.selectedProposal = proposal;
        this.learner = request.getLearner();
        this.developerProfile = proposal.getDeveloperProfile();
        this.status = MatchStatus.CONFIRMED;
        this.createdAt = Instant.now();
        this.updatedAt = createdAt;
    }

    @PreUpdate
    void beforeUpdate() { this.updatedAt = Instant.now(); }

    public UUID getId() { return id; }
    public LearningRequest getLearningRequest() { return learningRequest; }
    public TeachingProposal getSelectedProposal() { return selectedProposal; }
    public User getLearner() { return learner; }
    public DeveloperProfile getDeveloperProfile() { return developerProfile; }
    public MatchStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
