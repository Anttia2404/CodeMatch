package vn.codematch.foundation;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class RateLimitService {
    private static final int MAX_KEYS = 20_000;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final AtomicLong requests = new AtomicLong();

    public Decision consume(String key, int limit, Duration duration) {
        long now = System.nanoTime();
        if (requests.incrementAndGet() % 256 == 0 || windows.size() >= MAX_KEYS) {
            windows.entrySet().removeIf(entry -> entry.getValue().expiresAtNanos <= now);
        }

        if (!windows.containsKey(key) && windows.size() >= MAX_KEYS) {
            return new Decision(false, Math.max(1, duration.toSeconds()));
        }

        Decision[] result = new Decision[1];
        windows.compute(key, (ignored, current) -> {
            Window active = current == null || current.expiresAtNanos <= now
                ? new Window(now + duration.toNanos()) : current;
            if (active.count >= limit) {
                long remainingNanos = Math.max(0, active.expiresAtNanos - now);
                result[0] = new Decision(false, Math.max(1, (remainingNanos + 999_999_999L) / 1_000_000_000L));
                return active;
            }
            active.count++;
            result[0] = new Decision(true, 0);
            return active;
        });
        return result[0];
    }

    public record Decision(boolean allowed, long retryAfterSeconds) {}

    private static final class Window {
        private final long expiresAtNanos;
        private int count;

        private Window(long expiresAtNanos) { this.expiresAtNanos = expiresAtNanos; }
    }
}
