ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE learning_requests ADD COLUMN hidden_at TIMESTAMPTZ;
CREATE INDEX learning_requests_public_hidden_idx
    ON learning_requests (status, published_at DESC) WHERE hidden_at IS NULL;

CREATE TABLE moderation_reports (
    id UUID PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(24) NOT NULL CHECK (target_type IN ('LEARNING_REQUEST', 'DEVELOPER_PROFILE', 'TEACHING_PROPOSAL')),
    target_id UUID NOT NULL,
    reason VARCHAR(32) NOT NULL CHECK (reason IN ('SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'FRAUD', 'OTHER')),
    description VARCHAR(1000),
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT moderation_reports_review_state CHECK (
        (status = 'OPEN' AND reviewed_at IS NULL) OR (status <> 'OPEN' AND reviewed_at IS NOT NULL)
    ),
    CONSTRAINT moderation_reports_no_duplicate UNIQUE (reporter_id, target_type, target_id)
);
CREATE INDEX moderation_reports_queue_idx ON moderation_reports (status, created_at ASC);
CREATE INDEX moderation_reports_target_idx ON moderation_reports (target_type, target_id);

CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(48) NOT NULL,
    target_type VARCHAR(32),
    target_id UUID,
    outcome VARCHAR(16) NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX audit_events_created_idx ON audit_events (created_at DESC);
CREATE INDEX audit_events_target_idx ON audit_events (target_type, target_id, created_at DESC);
