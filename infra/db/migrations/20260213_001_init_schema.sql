BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM ('PUSH', 'PR_OPENED', 'PR_MERGED');

END IF;

END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analysis_status') THEN
    CREATE TYPE analysis_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finding_type') THEN
    CREATE TYPE finding_type AS ENUM ('API_BREAK', 'ARCH_VIOLATION', 'REFACTOR_SUGGESTION');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity_level') THEN
    CREATE TYPE severity_level AS ENUM ('INFO', 'WARNING', 'CRITICAL');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    github_user_id BIGINT UNIQUE NOT NULL,
    github_login VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS github_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    installation_id BIGINT UNIQUE NOT NULL,
    account_login VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    installed_by_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    github_repo_id BIGINT UNIQUE NOT NULL,
    installation_id UUID NOT NULL REFERENCES github_installations (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    repository_id UUID NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    github_event_id VARCHAR(255),
    type event_type NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    status analysis_status NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    analysis_run_id UUID NOT NULL REFERENCES analysis_runs (id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    type finding_type NOT NULL,
    severity severity_level NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_repository_id ON events (repository_id);

CREATE INDEX IF NOT EXISTS idx_findings_repository_id ON findings (repository_id);

CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings (severity);

COMMIT;