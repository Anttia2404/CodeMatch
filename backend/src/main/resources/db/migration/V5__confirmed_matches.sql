ALTER TABLE learning_requests DROP CONSTRAINT learning_requests_status_check;
ALTER TABLE learning_requests ADD CONSTRAINT learning_requests_status_check
    CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'MATCHED'));

ALTER TABLE learning_requests
    ADD CONSTRAINT learning_requests_id_learner_unique UNIQUE (id, learner_id);

ALTER TABLE teaching_proposals
    ADD CONSTRAINT teaching_proposals_id_request_developer_unique
    UNIQUE (id, learning_request_id, developer_profile_id);

CREATE TABLE matches (
    id UUID PRIMARY KEY,
    learning_request_id UUID NOT NULL,
    selected_proposal_id UUID NOT NULL,
    learner_id UUID NOT NULL,
    developer_profile_id UUID NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('CONFIRMED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT matches_one_per_request UNIQUE (learning_request_id),
    CONSTRAINT matches_selected_proposal_unique UNIQUE (selected_proposal_id),
    CONSTRAINT matches_request_learner_fk
        FOREIGN KEY (learning_request_id, learner_id)
        REFERENCES learning_requests (id, learner_id) ON DELETE CASCADE,
    CONSTRAINT matches_selected_proposal_fk
        FOREIGN KEY (selected_proposal_id, learning_request_id, developer_profile_id)
        REFERENCES teaching_proposals (id, learning_request_id, developer_profile_id) ON DELETE CASCADE
);

CREATE INDEX matches_developer_created_idx ON matches (developer_profile_id, created_at DESC);
