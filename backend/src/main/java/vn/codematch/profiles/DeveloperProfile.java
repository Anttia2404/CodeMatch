package vn.codematch.profiles;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import vn.codematch.identity.User;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "developer_profiles")
public class DeveloperProfile {
    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User owner;

    @Column(nullable = false, length = 120)
    private String headline;

    @Column(nullable = false, length = 3000)
    private String biography;

    @Column(name = "years_experience", nullable = false)
    private short yearsExperience;

    @Column(name = "github_url", length = 255)
    private String githubUrl;

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "portfolio_url", length = 255)
    private String portfolioUrl;

    @Column(name = "teaching_approach", nullable = false, length = 2000)
    private String teachingApproach;

    @Column(nullable = false, length = 500)
    private String availability;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "developer_profile_skills",
        joinColumns = @JoinColumn(name = "developer_profile_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id"))
    private Set<Skill> skills = new LinkedHashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected DeveloperProfile() {}

    public DeveloperProfile(UUID id, User owner, DeveloperProfileCommand command, Set<Skill> skills) {
        this.id = id;
        this.owner = owner;
        this.createdAt = Instant.now();
        update(command, skills);
    }

    public void update(DeveloperProfileCommand command, Set<Skill> skills) {
        this.headline = command.headline().trim();
        this.biography = command.biography().trim();
        this.yearsExperience = command.yearsExperience().shortValue();
        this.githubUrl = command.githubUrl();
        this.linkedinUrl = command.linkedinUrl();
        this.portfolioUrl = command.portfolioUrl();
        this.teachingApproach = command.teachingApproach().trim();
        this.availability = command.availability().trim();
        this.skills.clear();
        this.skills.addAll(skills);
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    void beforeUpdate() { this.updatedAt = Instant.now(); }

    public UUID getId() { return id; }
    public User getOwner() { return owner; }
    public String getHeadline() { return headline; }
    public String getBiography() { return biography; }
    public short getYearsExperience() { return yearsExperience; }
    public String getGithubUrl() { return githubUrl; }
    public String getLinkedinUrl() { return linkedinUrl; }
    public String getPortfolioUrl() { return portfolioUrl; }
    public String getTeachingApproach() { return teachingApproach; }
    public String getAvailability() { return availability; }
    public Set<Skill> getSkills() { return skills; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
