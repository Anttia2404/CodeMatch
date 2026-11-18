package vn.codematch.foundation;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class PilotMetrics {
    private final MeterRegistry registry;

    public PilotMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    public void record(String eventName) {
        var counter = registry.counter("codematch.pilot.events", "event", eventName);
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            counter.increment();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                counter.increment();
            }
        });
    }

    public void authenticationFailure() {
        registry.counter("codematch.security.authentication.failures").increment();
    }

    public void rateLimitedRequest() {
        registry.counter("codematch.security.rate_limit.events").increment();
    }

    public void proposalSubmissionError() {
        registry.counter("codematch.proposals.submission.errors").increment();
    }

    public void matchConfirmationError() {
        registry.counter("codematch.matches.confirmation.errors").increment();
    }
}
