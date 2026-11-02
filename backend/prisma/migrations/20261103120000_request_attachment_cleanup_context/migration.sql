-- Preserve the request context and claim ownership for durable cleanup retries.
ALTER TABLE "CloudinaryCleanupOperation"
ADD COLUMN "processing_token" TEXT,
ADD COLUMN "request_id" TEXT,
ADD COLUMN "request_type" "NotificationRequestType";

CREATE UNIQUE INDEX "CloudinaryCleanupOperation_processing_token_key"
ON "CloudinaryCleanupOperation"("processing_token");

CREATE INDEX "CloudinaryCleanupOperation_request_type_request_id_idx"
ON "CloudinaryCleanupOperation"("request_type", "request_id");

UPDATE "CloudinaryCleanupOperation"
SET
    "status" = 'FAILED',
    "processing_token" = NULL,
    "completed_at" = NULL,
    "last_error" = COALESCE("last_error", 'Previous cleanup attempt requires retry.')
WHERE "status" = 'PROCESSING';

ALTER TABLE "CloudinaryCleanupOperation"
DROP CONSTRAINT "CloudinaryCleanupOperation_state_check";

ALTER TABLE "CloudinaryCleanupOperation"
ADD CONSTRAINT "CloudinaryCleanupOperation_state_check"
CHECK (
    "attempt_count" >= 0
    AND (
        ("status" = 'COMPLETED' AND "completed_at" IS NOT NULL AND "processing_token" IS NULL)
        OR ("status" = 'PROCESSING' AND "completed_at" IS NULL AND "processing_token" IS NOT NULL)
        OR ("status" IN ('PENDING', 'FAILED') AND "completed_at" IS NULL AND "processing_token" IS NULL)
    )
);

ALTER TABLE "CloudinaryCleanupOperation"
ADD CONSTRAINT "CloudinaryCleanupOperation_request_snapshot_check"
CHECK (
    ("request_type" IS NULL AND "request_id" IS NULL)
    OR (
        "request_type" IS NOT NULL
        AND "request_id" IS NOT NULL
        AND length(btrim("request_id")) > 0
    )
);
