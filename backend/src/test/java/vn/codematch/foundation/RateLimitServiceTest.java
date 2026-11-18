package vn.codematch.foundation;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitServiceTest {
    @Test
    void limitsRequestsPerKeyAndKeepsKeysIndependent() {
        RateLimitService service = new RateLimitService();

        assertThat(service.consume("login:one", 2, Duration.ofMinutes(1)).allowed()).isTrue();
        assertThat(service.consume("login:one", 2, Duration.ofMinutes(1)).allowed()).isTrue();
        assertThat(service.consume("login:one", 2, Duration.ofMinutes(1))).isEqualTo(new RateLimitService.Decision(false, 60));
        assertThat(service.consume("login:two", 2, Duration.ofMinutes(1)).allowed()).isTrue();
    }

    @Test
    void enforcesLimitWhenRequestsArriveConcurrently() throws Exception {
        RateLimitService service = new RateLimitService();
        Callable<Boolean> request = () -> service.consume("register:shared", 10, Duration.ofMinutes(1)).allowed();
        try (var executor = Executors.newFixedThreadPool(16)) {
            List<Boolean> decisions = executor.invokeAll(java.util.Collections.nCopies(64, request)).stream()
                .map(future -> {
                    try { return future.get(); }
                    catch (Exception exception) { throw new IllegalStateException(exception); }
                }).toList();
            assertThat(decisions.stream().filter(Boolean::booleanValue)).hasSize(10);
        }
    }
}
