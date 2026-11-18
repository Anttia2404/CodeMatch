package vn.codematch.requests;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;
import vn.codematch.identity.User;
import vn.codematch.profiles.Skill;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "learning_requests")
public class LearningRequest {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_id", nullable = false, updatable = false)
    private User learner;

    @Column(nullable = false, length = 140)
    private String title;

    @Column(nullable = false, length = 3000)
    private String description;

    @Column(name = "learning_goal", nullable = false, length = 2000)
    private String learningGoal;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_level", nullable = false, length = 20)
    private LearningLevel currentLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_format", nullable = false, length = 16)
    private LearningFormat preferredFormat;

    @Column(length = 100)
    private String city;

    @Column(name = "budget_min")
    private Long budgetMin;

    @Column(name = "budget_max")
    private Long budgetMax;

    @Enumerated(EnumType.STRING)
    @Column(name = "budget_unit", length = 20)
    private BudgetUnit budgetUnit;

    @Column(name = "preferred_schedule", nullable = false, length = 500)
    private String preferredSchedule;

    @Column(name = "expected_duration", nullable = false, length = 120)
    private String expectedDuration;

    @Column(name = "teaching_expectations", nullable = false, length = 1000)
    private String teachingExpectations;

    @Column(name = "requires_cv", nullable = false)
    private boolean requiresCv;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LearningRequestStatus status;

    @ManyToMany(fetch = FetchType.LAZY)
    @BatchSize(size = 20)
    @JoinTable(name = "learning_request_skills",
        joinColumns = @JoinColumn(name = "learning_request_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id"))
    private Set<Skill> skills = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    protected LearningRequest() {}

    public LearningRequest(UUID id, User learner, LearningRequestCommand command, Set<Skill> skills) {
        this.id = id;
        this.learner = learner;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
        this.status = LearningRequestStatus.DRAFT;
        updateDetails(command, skills);
    }

    public void updateDetails(LearningRequestCommand command, Set<Skill> skills) {
        this.title = command.title().trim();
        this.description = command.description().trim();
        this.learningGoal = command.learningGoal().trim();
        this.currentLevel = command.currentLevel();
        this.preferredFormat = command.preferredFormat();
        this.city = command.city() == null || command.city().isBlank() ? null : command.city().trim();
        this.budgetMin = command.budgetMin();
        this.budgetMax = command.budgetMax();
        this.budgetUnit = command.budgetUnit();
        this.preferredSchedule = command.preferredSchedule().trim();
        this.expectedDuration = command.expectedDuration().trim();
        this.teachingExpectations = command.teachingExpectations().trim();
        this.requiresCv = command.requiresCv();
        this.skills = new HashSet<>(skills);
        this.updatedAt = Instant.now();
    }

    public void publish() {
        this.status = LearningRequestStatus.OPEN;
        this.publishedAt = Instant.now();
        this.updatedAt = this.publishedAt;
    }

    public void close() {
        this.status = LearningRequestStatus.CLOSED;
        this.closedAt = Instant.now();
        this.updatedAt = this.closedAt;
    }

    public void markMatched() {
        this.status = LearningRequestStatus.MATCHED;
        this.closedAt = Instant.now();
        this.updatedAt = this.closedAt;
    }

    @PreUpdate
    void beforeUpdate() { this.updatedAt = Instant.now(); }

    public UUID getId() { return id; }
    public User getLearner() { return learner; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getLearningGoal() { return learningGoal; }
    public LearningLevel getCurrentLevel() { return currentLevel; }
    public LearningFormat getPreferredFormat() { return preferredFormat; }
    public String getCity() { return city; }
    public Long getBudgetMin() { return budgetMin; }
    public Long getBudgetMax() { return budgetMax; }
    public BudgetUnit getBudgetUnit() { return budgetUnit; }
    public String getPreferredSchedule() { return preferredSchedule; }
    public String getExpectedDuration() { return expectedDuration; }
    public String getTeachingExpectations() { return teachingExpectations; }
    public boolean isRequiresCv() { return requiresCv; }
    public LearningRequestStatus getStatus() { return status; }
    public Set<Skill> getSkills() { return skills; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getPublishedAt() { return publishedAt; }
    public Instant getClosedAt() { return closedAt; }
}
