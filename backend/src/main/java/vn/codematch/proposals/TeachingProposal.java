package vn.codematch.proposals;

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
import vn.codematch.cvs.DeveloperCv;
import vn.codematch.profiles.DeveloperProfile;
import vn.codematch.requests.BudgetUnit;
import vn.codematch.requests.LearningRequest;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "teaching_proposals")
public class TeachingProposal {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learning_request_id", nullable = false)
    private LearningRequest learningRequest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "developer_profile_id", nullable = false)
    private DeveloperProfile developerProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cv_id")
    private DeveloperCv cv;

    @Column(nullable = false, length = 3000)
    private String introduction;

    @Column(name = "teaching_approach", nullable = false, length = 3000)
    private String teachingApproach;

    @Column(name = "relevant_experience", nullable = false, length = 2000)
    private String relevantExperience;

    @Column(name = "proposed_rate", nullable = false)
    private long proposedRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "rate_unit", nullable = false, length = 20)
    private BudgetUnit rateUnit;

    @Column(name = "proposed_schedule", nullable = false, length = 500)
    private String proposedSchedule;

    @Column(name = "estimated_duration", nullable = false, length = 120)
    private String estimatedDuration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ProposalStatus status = ProposalStatus.SUBMITTED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "withdrawn_at")
    private Instant withdrawnAt;

    protected TeachingProposal() {}

    public TeachingProposal(UUID id, LearningRequest learningRequest, DeveloperProfile developerProfile,
                            DeveloperCv cv, ProposalCommand command) {
        this.id = id;
        this.learningRequest = learningRequest;
        this.developerProfile = developerProfile;
        this.cv = cv;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
        apply(command);
    }

    public void update(ProposalCommand command, DeveloperCv replacementCv, boolean replaceCv) {
        apply(command);
        if (replaceCv) this.cv = replacementCv;
        this.updatedAt = Instant.now();
    }

    public void withdraw() {
        this.status = ProposalStatus.WITHDRAWN;
        this.withdrawnAt = Instant.now();
        this.updatedAt = this.withdrawnAt;
    }

    private void apply(ProposalCommand command) {
        this.introduction = command.introduction().trim();
        this.teachingApproach = command.teachingApproach().trim();
        this.relevantExperience = command.relevantExperience().trim();
        this.proposedRate = command.proposedRate();
        this.rateUnit = command.rateUnit();
        this.proposedSchedule = command.proposedSchedule().trim();
        this.estimatedDuration = command.estimatedDuration().trim();
    }

    @PreUpdate
    void beforeUpdate() { this.updatedAt = Instant.now(); }

    public UUID getId() { return id; }
    public LearningRequest getLearningRequest() { return learningRequest; }
    public DeveloperProfile getDeveloperProfile() { return developerProfile; }
    public DeveloperCv getCv() { return cv; }
    public String getIntroduction() { return introduction; }
    public String getTeachingApproach() { return teachingApproach; }
    public String getRelevantExperience() { return relevantExperience; }
    public long getProposedRate() { return proposedRate; }
    public BudgetUnit getRateUnit() { return rateUnit; }
    public String getProposedSchedule() { return proposedSchedule; }
    public String getEstimatedDuration() { return estimatedDuration; }
    public ProposalStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getWithdrawnAt() { return withdrawnAt; }
}
