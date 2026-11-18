package vn.codematch.cvs;

import java.time.Instant;
import java.util.UUID;

public record DeveloperCvResponse(UUID id, String fileName, long sizeBytes, Instant uploadedAt, Instant updatedAt) {
    public static DeveloperCvResponse from(DeveloperCv cv) {
        return new DeveloperCvResponse(cv.getId(), cv.getOriginalName(), cv.getSizeBytes(), cv.getCreatedAt(), cv.getUpdatedAt());
    }
}
