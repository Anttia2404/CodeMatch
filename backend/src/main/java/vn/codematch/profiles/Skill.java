package vn.codematch.profiles;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "skills")
public class Skill {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    protected Skill() {}

    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
}
