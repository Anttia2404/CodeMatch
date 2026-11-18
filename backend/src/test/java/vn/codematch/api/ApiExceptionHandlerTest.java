package vn.codematch.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import static org.assertj.core.api.Assertions.assertThat;

class ApiExceptionHandlerTest {
    @Test
    void rateLimitResponseIncludesRetryAfterAndSafeProblemDetails() {
        var response = new ApiExceptionHandler().handleApiException(ApiException.tooManyRequests(42));

        assertThat(response.getStatusCode().value()).isEqualTo(429);
        assertThat(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isEqualTo("42");
        assertThat(response.getBody().getProperties()).containsEntry("code", "rate_limited");
        assertThat(response.getBody().getDetail()).doesNotContain("exception");
    }
}
