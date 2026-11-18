package vn.codematch.foundation;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import vn.codematch.api.ApiException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RateLimitInterceptorTest {
    @Test
    void returnsStructured429WithRetryAfterForLoginAttempts() {
        RateLimitInterceptor interceptor = new RateLimitInterceptor(new RateLimitService(), true,
            1, 60, 5, 60, 5, 60, 5, 60);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("192.0.2.4");

        assertThat(interceptor.preHandle(request, new MockHttpServletResponse(), new Object())).isTrue();
        assertThatThrownBy(() -> interceptor.preHandle(request, new MockHttpServletResponse(), new Object()))
            .isInstanceOf(ApiException.class)
            .satisfies(error -> {
                ApiException exception = (ApiException) error;
                assertThat(exception.getStatus().value()).isEqualTo(429);
                assertThat(exception.getCode()).isEqualTo("rate_limited");
                assertThat(exception.getRetryAfterSeconds()).isEqualTo(60);
            });
    }

    @Test
    void appliesProposalAndCvDownloadBuckets() {
        RateLimitInterceptor interceptor = new RateLimitInterceptor(new RateLimitService(), true,
            3, 60, 3, 60, 1, 60, 1, 60);
        MockHttpServletRequest proposal = new MockHttpServletRequest("POST", "/api/v1/learning-requests/abc/proposals");
        proposal.setRemoteAddr("192.0.2.5");
        MockHttpServletRequest cv = new MockHttpServletRequest("GET", "/api/v1/proposals/abc/cv");
        cv.setRemoteAddr("192.0.2.5");

        assertThat(interceptor.preHandle(proposal, new MockHttpServletResponse(), new Object())).isTrue();
        assertThat(interceptor.preHandle(cv, new MockHttpServletResponse(), new Object())).isTrue();
        assertThatThrownBy(() -> interceptor.preHandle(proposal, new MockHttpServletResponse(), new Object()))
            .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> interceptor.preHandle(cv, new MockHttpServletResponse(), new Object()))
            .isInstanceOf(ApiException.class);
    }
}
