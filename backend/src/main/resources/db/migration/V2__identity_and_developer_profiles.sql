CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    account_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_account_status_check CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'CLOSED'))
);

CREATE UNIQUE INDEX users_email_lower_unique ON users (LOWER(email));

CREATE TABLE developer_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(120) NOT NULL,
    biography VARCHAR(3000) NOT NULL,
    years_experience SMALLINT NOT NULL,
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    teaching_approach VARCHAR(2000) NOT NULL,
    availability VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT developer_profiles_experience_check CHECK (years_experience BETWEEN 0 AND 60)
);

CREATE TABLE skills (
    id UUID PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE developer_profile_skills (
    developer_profile_id UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    PRIMARY KEY (developer_profile_id, skill_id)
);

CREATE INDEX developer_profile_skills_skill_id_idx ON developer_profile_skills(skill_id);

CREATE TABLE SPRING_SESSION (
    PRIMARY_ID CHAR(36) NOT NULL PRIMARY KEY,
    SESSION_ID CHAR(36) NOT NULL UNIQUE,
    CREATION_TIME BIGINT NOT NULL,
    LAST_ACCESS_TIME BIGINT NOT NULL,
    MAX_INACTIVE_INTERVAL INT NOT NULL,
    EXPIRY_TIME BIGINT NOT NULL,
    PRINCIPAL_NAME VARCHAR(100)
);
CREATE INDEX SPRING_SESSION_IX2 ON SPRING_SESSION (EXPIRY_TIME);
CREATE INDEX SPRING_SESSION_IX3 ON SPRING_SESSION (PRINCIPAL_NAME);

CREATE TABLE SPRING_SESSION_ATTRIBUTES (
    SESSION_PRIMARY_ID CHAR(36) NOT NULL,
    ATTRIBUTE_NAME VARCHAR(200) NOT NULL,
    ATTRIBUTE_BYTES BYTEA NOT NULL,
    PRIMARY KEY (SESSION_PRIMARY_ID, ATTRIBUTE_NAME),
    CONSTRAINT SPRING_SESSION_ATTRIBUTES_FK FOREIGN KEY (SESSION_PRIMARY_ID)
        REFERENCES SPRING_SESSION(PRIMARY_ID) ON DELETE CASCADE
);

INSERT INTO skills (id, slug, name) VALUES
    ('c274e921-1e10-5bb4-99b5-748eb82d3961', 'java', 'Java'),
    ('f850987e-f0de-5269-b145-9434a1d44862', 'spring-boot', 'Spring Boot'),
    ('405507c6-13cc-5819-892f-f9762f14704f', 'python', 'Python'),
    ('caf3005e-420a-5f5f-8dd5-aee490e65c67', 'javascript', 'JavaScript'),
    ('27561612-2091-5d65-886d-8fc3c11271a9', 'typescript', 'TypeScript'),
    ('e94a7247-e7b8-503e-b886-b965ec27b491', 'react', 'React'),
    ('c9980c19-2ae4-5a5b-9b31-17f9bcc4eeb0', 'nodejs', 'Node.js'),
    ('134c281e-1232-5605-b412-30f16f8c436f', 'sql', 'SQL'),
    ('540741bb-9db6-5bfd-936c-b1f33231c92e', 'postgresql', 'PostgreSQL'),
    ('3b98e180-bef4-528b-a216-40d8b1a3af01', 'data-structures-algorithms', 'Data Structures and Algorithms'),
    ('f5a28bf7-d792-5ad1-a8cb-a2e5c0e2d6f6', 'machine-learning', 'Machine Learning');
