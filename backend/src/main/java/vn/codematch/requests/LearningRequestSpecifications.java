package vn.codematch.requests;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import vn.codematch.profiles.Skill;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class LearningRequestSpecifications {
    private LearningRequestSpecifications() {}

    public static Specification<LearningRequest> discovery(String keyword, List<UUID> skillIds,
            LearningLevel level, LearningFormat format, Long minBudget, Long maxBudget,
            BudgetUnit unit, Boolean requiresCv) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("status"), LearningRequestStatus.OPEN));
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase(java.util.Locale.ROOT) + "%";
                predicates.add(builder.or(
                    builder.like(builder.lower(root.get("title")), pattern),
                    builder.like(builder.lower(root.get("description")), pattern),
                    builder.like(builder.lower(root.get("learningGoal")), pattern),
                    builder.like(builder.lower(root.get("teachingExpectations")), pattern),
                    builder.like(builder.lower(root.get("city")), pattern)));
            }
            if (skillIds != null && !skillIds.isEmpty()) {
                var subquery = query.subquery(UUID.class);
                var correlated = subquery.correlate(root);
                var skill = correlated.join("skills");
                subquery.select(correlated.get("id"))
                    .where(skill.get("id").in(skillIds));
                predicates.add(builder.exists(subquery));
            }
            if (level != null) predicates.add(builder.equal(root.get("currentLevel"), level));
            if (format != null) predicates.add(builder.equal(root.get("preferredFormat"), format));
            if (unit != null) predicates.add(builder.equal(root.get("budgetUnit"), unit));
            if (requiresCv != null) predicates.add(builder.equal(root.get("requiresCv"), requiresCv));
            if (minBudget != null) {
                predicates.add(builder.isNotNull(root.get("budgetMax")));
                predicates.add(builder.greaterThanOrEqualTo(root.get("budgetMax"), minBudget));
            }
            if (maxBudget != null) {
                predicates.add(builder.isNotNull(root.get("budgetMin")));
                predicates.add(builder.lessThanOrEqualTo(root.get("budgetMin"), maxBudget));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }
}
