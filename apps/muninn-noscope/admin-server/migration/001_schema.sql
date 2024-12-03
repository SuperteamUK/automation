CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE objects (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    object_id UUID NOT NULL REFERENCES objects(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    input JSONB NOT NULL,
    output JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT tasks_started_requires_processing CHECK (
        (status = 'processing' AND started_at IS NOT NULL) OR
        (status != 'processing' AND (started_at IS NULL OR completed_at IS NOT NULL))
    )
);

CREATE INDEX idx_tasks_object_id ON tasks(object_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_objects_last_synced ON objects(last_synced_at);

CREATE TABLE object_scan_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    latest TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);