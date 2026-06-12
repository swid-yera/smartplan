-- feat(kripto): store approval signature artifacts

CREATE TABLE rup_signature_artifacts (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    rup_id UUID NOT NULL REFERENCES rups(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL,
    document_version UUID NOT NULL DEFAULT gen_random_uuid(),
    document_hash TEXT NOT NULL,
    key_id UUID NOT NULL,
    user_id UUID NOT NULL,
    signature TEXT NOT NULL,
    signer_name TEXT NOT NULL,
    signer_role TEXT NOT NULL,
    signature_id TEXT NOT NULL,
    verification_url TEXT NOT NULL,
    qr_svg TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT rup_signature_artifacts_rup_version_unique UNIQUE (rup_id, document_version),
    CONSTRAINT rup_signature_artifacts_unique UNIQUE (rup_id, document_hash, key_id, user_id, signature),
    CONSTRAINT rup_signature_artifacts_signature_id_unique UNIQUE (signature_id)
);

CREATE INDEX idx_rup_signature_artifacts_rup_created_at
    ON rup_signature_artifacts (rup_id, created_at DESC);
