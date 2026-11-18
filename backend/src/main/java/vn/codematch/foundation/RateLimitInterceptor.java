package vn.codematch.foundation;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import vn.codematch.api.ApiException;
import vn.codematch.identity.AccountPrincipal;

import java.time.Duration;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    private final RateLimitService rateLimits;
    private final boolean enabled;
    private final Bucket login;
    private final Bucket registration;
    private final Bucket proposal;
    private final Bucket cvDownload;

    public RateLimitInterceptor(RateLimitService rateLimits,
            @Value("${codematch.rate-limit.enabled:true}") boolean enabled,
            @Value("${codematch.rate-limit.login.limit:12}") int loginLimit,
            @Value("${codematch.rate-limit.login.window-seconds:900}") long loginWindow,
            @Value("${codematch.rate-limit.registration.limit:20}") int registrationLimit,
            @Value("${codematch.rate-limit.registration.window-seconds:3600}") long registrationWindow,
            @Value("${codematch.rate-limit.proposal.limit:8}") int proposalLimit,
            @Value("${codematch.rate-limit.proposal.window-seconds:60}") long proposalWindow,
            @Value("${codematch.rate-limit.cv-download.limit:30}") int cvDownloadLimit,
            @Value("${codematch.rate-limit.cv-download.window-seconds:60}") long cvDownloadWindow) {
        this.rateLimits = rateLimits;
        this.enabled = enabled;
        this.login = new Bucket("login", loginLimit, loginWindow);
        this.registration = new Bucket("registration", registrationLimit, registrationWindow);
        this.proposal = new Bucket("proposal", proposalLimit, proposalWindow);
        this.cvDownload = new Bucket("cv-download", cvDownloadLimit, cvDownloadWindow);
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!enabled) return true;
        Bucket bucket = bucketFor(request);
        if (bucket == null) return true;

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String principal = authentication == null || !authentication.isAuthenticated() ? "anonymous"
            : authentication.getPrincipal() instanceof AccountPrincipal account
                ? account.id().toString() : authentication.getName();
        String key = bucket.name + ":" + request.getRemoteAddr() + ":" + principal;
        RateLimitService.Decision decision = rateLimits.consume(key, bucket.limit, Duration.ofSeconds(bucket.windowSeconds));
        if (!decision.allowed()) throw ApiException.tooManyRequests(decision.retryAfterSeconds());
        return true;
    }

    private Bucket bucketFor(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if ("POST".equals(method) && "/api/v1/auth/login".equals(path)) return login;
        if ("POST".equals(method) && "/api/v1/auth/register".equals(path)) return registration;
        if ("POST".equals(method) && path.matches("/api/v1/learning-requests/[^/]+/proposals")) return proposal;
        if ("GET".equals(method) && (path.matches("/api/v1/developer/cvs/[^/]+/file")
                || path.matches("/api/v1/proposals/[^/]+/cv"))) return cvDownload;
        return null;
    }

    private record Bucket(String name, int limit, long windowSeconds) {
        private Bucket {
            if (limit < 1 || windowSeconds < 1) throw new IllegalArgumentException("Rate limit must be positive.");
        }
    }
}
