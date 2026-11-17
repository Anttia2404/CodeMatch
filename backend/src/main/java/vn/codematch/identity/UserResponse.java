package vn.codematch.identity;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(UUID id, String email, String displayName, AccountStatus status,
                           Instant createdAt, Instant updatedAt) {
    static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getAccountStatus(),
            user.getCreatedAt(), user.getUpdatedAt());
    }
}
