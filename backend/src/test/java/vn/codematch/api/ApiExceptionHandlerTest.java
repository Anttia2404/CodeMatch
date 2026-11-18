package vn.codematch.api;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import vn.codematch.foundation.PilotMetrics;

import static org.assertj.core.api.Assertions.assertThat;

class ApiExceptionHandlerTest {
    @Test
    void rateLimitResponseIncludesRetryAfterAndSafeProblemDetails() {
        var response = new ApiExceptionHandler(new PilotMetrics(new SimpleMeterRegistry()))
            .handleApiException(ApiException.tooManyRequests(42), new MockHttpServletRequest("POST", "/api/v1/auth/login"));

        assertThat(response.getStatusCode().value()).isEqualTo(429);
        assertThat(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isEqualTo("42");
        assertThat(response.getBody().getProperties()).containsEntry("code", "rate_limited");
        assertThat(response.getBody().getDetail()).doesNotContain("exception");
    }
}
