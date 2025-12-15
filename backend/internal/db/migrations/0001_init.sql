DROP TABLE IF EXISTS objects;

CREATE TABLE objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title JSONB,
    year JSONB,
    type JSONB,
    course JSONB,
    study_form JSONB,
    exploration_note JSONB,
    goals JSONB,
    prerequisites JSONB,
    postrequisites JSONB,
    group_id JSONB,
    contacts JSONB,
    internet_resources JSONB,
    technical_resources JSONB,
    rup_type JSONB,
    disciplines JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
