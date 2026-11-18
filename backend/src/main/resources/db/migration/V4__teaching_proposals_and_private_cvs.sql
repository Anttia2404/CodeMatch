CREATE TABLE developer_cvs (
    id UUID PRIMARY KEY,
    developer_profile_id UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
    storage_key UUID NOT NULL UNIQUE,
    original_name VARCHAR(180) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes BETWEEN 1 AND 5242880),
    media_type VARCHAR(50) NOT NULL CHECK (media_type = 'application/pdf'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT developer_cvs_id_profile_unique UNIQUE (id, developer_profile_id)
);

CREATE INDEX developer_cvs_profile_created_idx ON developer_cvs (developer_profile_id, created_at DESC);

CREATE TABLE teaching_proposals (
    id UUID PRIMARY KEY,
    learning_request_id UUID NOT NULL REFERENCES learning_requests(id) ON DELETE CASCADE,
    developer_profile_id UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
    cv_id UUID,
    introduction VARCHAR(3000) NOT NULL,
    teaching_approach VARCHAR(3000) NOT NULL,
    relevant_experience VARCHAR(2000) NOT NULL,
    proposed_rate BIGINT NOT NULL CHECK (proposed_rate > 0),
    rate_unit VARCHAR(20) NOT NULL CHECK (rate_unit IN ('PER_HOUR', 'PER_SESSION', 'TOTAL')),
    proposed_schedule VARCHAR(500) NOT NULL,
    estimated_duration VARCHAR(120) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'WITHDRAWN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    withdrawn_at TIMESTAMPTZ,
    CONSTRAINT teaching_proposals_lifecycle_check CHECK (
        (status = 'SUBMITTED' AND withdrawn_at IS NULL) OR
        (status = 'WITHDRAWN' AND withdrawn_at IS NOT NULL)
    ),
    CONSTRAINT teaching_proposals_cv_owner_fk
        FOREIGN KEY (cv_id, developer_profile_id)
        REFERENCES developer_cvs (id, developer_profile_id)
        ON DELETE SET NULL (cv_id)
);

CREATE UNIQUE INDEX teaching_proposals_one_active_per_developer
    ON teaching_proposals (learning_request_id, developer_profile_id)
    WHERE status = 'SUBMITTED';
CREATE INDEX teaching_proposals_request_status_created_idx
    ON teaching_proposals (learning_request_id, status, created_at DESC);
CREATE INDEX teaching_proposals_developer_status_updated_idx
    ON teaching_proposals (developer_profile_id, status, updated_at DESC);
