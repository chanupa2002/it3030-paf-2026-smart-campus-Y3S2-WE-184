CREATE TABLE IF NOT EXISTS "Password_reset" (
    request_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id BIGINT NOT NULL,
    code TEXT NOT NULL,
    attempts BIGINT NOT NULL DEFAULT 0,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT password_reset_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES "Users"(user_id)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user_status_created
    ON "Password_reset" (user_id, status, created_at DESC);
