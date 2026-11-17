CREATE TABLE learning_requests (
    id UUID PRIMARY KEY,
    learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(140) NOT NULL,
    description VARCHAR(3000) NOT NULL,
    learning_goal VARCHAR(2000) NOT NULL,
    current_level VARCHAR(20) NOT NULL,
    preferred_format VARCHAR(16) NOT NULL,
    city VARCHAR(100),
    budget_min BIGINT,
    budget_max BIGINT,
    budget_unit VARCHAR(20),
    preferred_schedule VARCHAR(500) NOT NULL,
    expected_duration VARCHAR(120) NOT NULL,
    teaching_expectations VARCHAR(1000) NOT NULL,
    requires_cv BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    CONSTRAINT learning_requests_level_check CHECK (current_level IN ('BEGINNER', 'BASIC', 'INTERMEDIATE', 'ADVANCED')),
    CONSTRAINT learning_requests_format_check CHECK (preferred_format IN ('ONLINE', 'OFFLINE')),
    CONSTRAINT learning_requests_budget_unit_check CHECK (budget_unit IS NULL OR budget_unit IN ('PER_HOUR', 'PER_SESSION', 'TOTAL')),
    CONSTRAINT learning_requests_budget_pair_check CHECK ((budget_min IS NULL AND budget_max IS NULL AND budget_unit IS NULL) OR (budget_min IS NOT NULL AND budget_max IS NOT NULL AND budget_unit IS NOT NULL)),
    CONSTRAINT learning_requests_budget_check CHECK (budget_min IS NULL OR (budget_min >= 0 AND budget_max >= budget_min)),
    CONSTRAINT learning_requests_status_check CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED')),
    CONSTRAINT learning_requests_location_check CHECK ((preferred_format = 'ONLINE') OR city IS NOT NULL)
);

CREATE INDEX learning_requests_open_published_idx ON learning_requests (published_at DESC, id) WHERE status = 'OPEN';
CREATE INDEX learning_requests_owner_status_updated_idx ON learning_requests (learner_id, status, updated_at DESC);
CREATE INDEX learning_requests_level_format_idx ON learning_requests (current_level, preferred_format, status);
CREATE INDEX learning_requests_budget_idx ON learning_requests (budget_unit, budget_min, budget_max) WHERE status = 'OPEN';

CREATE TABLE learning_request_skills (
    learning_request_id UUID NOT NULL REFERENCES learning_requests(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    PRIMARY KEY (learning_request_id, skill_id)
);
CREATE INDEX learning_request_skills_skill_id_idx ON learning_request_skills (skill_id, learning_request_id);

CREATE TABLE saved_requests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    learning_request_id UUID NOT NULL REFERENCES learning_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT saved_requests_user_request_unique UNIQUE (user_id, learning_request_id)
);
CREATE INDEX saved_requests_user_created_idx ON saved_requests (user_id, created_at DESC);
