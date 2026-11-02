-- CreateEnum
CREATE TYPE "AttachmentStatus" AS ENUM ('ACTIVE', 'PENDING_DELETION', 'DELETED', 'CLEANUP_FAILED');

-- CreateEnum
CREATE TYPE "CloudinaryCleanupStatus" AS ENUM ('PENDING', 'PROCESSING', 'FAILED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationRequestType" AS ENUM ('QUOTE', 'VISIT', 'BOQ');

-- CreateEnum
CREATE TYPE "NotificationAttemptStatus" AS ENUM ('SENDING', 'SENT', 'FAILED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "quote_request_id" TEXT,
    "visit_request_id" TEXT,
    "boq_request_id" TEXT,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "public_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "delivery_type" TEXT NOT NULL,
    "status" "AttachmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudinaryCleanupOperation" (
    "id" TEXT NOT NULL,
    "attachment_id" TEXT,
    "public_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "delivery_type" TEXT NOT NULL,
    "status" "CloudinaryCleanupStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "CloudinaryCleanupOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAttempt" (
    "id" TEXT NOT NULL,
    "request_type" "NotificationRequestType" NOT NULL,
    "request_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "quote_request_id" TEXT,
    "visit_request_id" TEXT,
    "boq_request_id" TEXT,
    "status" "NotificationAttemptStatus" NOT NULL DEFAULT 'SENDING',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error_code" TEXT,

    CONSTRAINT "NotificationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAttachmentAccessToken" (
    "id" TEXT NOT NULL,
    "attachment_id" TEXT NOT NULL,
    "notification_attempt_id" TEXT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "EmailAttachmentAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_quote_request_id_idx" ON "Attachment"("quote_request_id");

-- CreateIndex
CREATE INDEX "Attachment_visit_request_id_idx" ON "Attachment"("visit_request_id");

-- CreateIndex
CREATE INDEX "Attachment_boq_request_id_idx" ON "Attachment"("boq_request_id");

-- CreateIndex
CREATE INDEX "Attachment_status_created_at_idx" ON "Attachment"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_public_id_resource_type_delivery_type_key" ON "Attachment"("public_id", "resource_type", "delivery_type");

-- CreateIndex
CREATE INDEX "CloudinaryCleanupOperation_status_created_at_idx" ON "CloudinaryCleanupOperation"("status", "created_at");

-- CreateIndex
CREATE INDEX "CloudinaryCleanupOperation_attachment_id_idx" ON "CloudinaryCleanupOperation"("attachment_id");

-- CreateIndex
CREATE UNIQUE INDEX "CloudinaryCleanupOperation_public_id_resource_type_delivery_key" ON "CloudinaryCleanupOperation"("public_id", "resource_type", "delivery_type");

-- CreateIndex
CREATE INDEX "NotificationAttempt_request_type_request_id_started_at_idx" ON "NotificationAttempt"("request_type", "request_id", "started_at");

-- CreateIndex
CREATE INDEX "NotificationAttempt_status_started_at_idx" ON "NotificationAttempt"("status", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationAttempt_request_type_request_id_attempt_number_key" ON "NotificationAttempt"("request_type", "request_id", "attempt_number");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAttachmentAccessToken_token_hash_key" ON "EmailAttachmentAccessToken"("token_hash");

-- CreateIndex
CREATE INDEX "EmailAttachmentAccessToken_attachment_id_issued_at_idx" ON "EmailAttachmentAccessToken"("attachment_id", "issued_at");

-- CreateIndex
CREATE INDEX "EmailAttachmentAccessToken_notification_attempt_id_idx" ON "EmailAttachmentAccessToken"("notification_attempt_id");

-- CreateIndex
CREATE INDEX "EmailAttachmentAccessToken_expires_at_revoked_at_idx" ON "EmailAttachmentAccessToken"("expires_at", "revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAttachmentAccessToken_attachment_id_notification_attem_key" ON "EmailAttachmentAccessToken"("attachment_id", "notification_attempt_id");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_quote_request_id_fkey" FOREIGN KEY ("quote_request_id") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_visit_request_id_fkey" FOREIGN KEY ("visit_request_id") REFERENCES "VisitRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_boq_request_id_fkey" FOREIGN KEY ("boq_request_id") REFERENCES "BOQRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloudinaryCleanupOperation" ADD CONSTRAINT "CloudinaryCleanupOperation_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "Attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAttempt" ADD CONSTRAINT "NotificationAttempt_quote_request_id_fkey" FOREIGN KEY ("quote_request_id") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAttempt" ADD CONSTRAINT "NotificationAttempt_visit_request_id_fkey" FOREIGN KEY ("visit_request_id") REFERENCES "VisitRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAttempt" ADD CONSTRAINT "NotificationAttempt_boq_request_id_fkey" FOREIGN KEY ("boq_request_id") REFERENCES "BOQRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAttachmentAccessToken" ADD CONSTRAINT "EmailAttachmentAccessToken_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "Attachment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAttachmentAccessToken" ADD CONSTRAINT "EmailAttachmentAccessToken_notification_attempt_id_fkey" FOREIGN KEY ("notification_attempt_id") REFERENCES "NotificationAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prisma does not currently model CHECK constraints. Keep active attachments
-- attached to exactly one request; detached rows are retained for deletion.
ALTER TABLE "Attachment"
ADD CONSTRAINT "Attachment_request_owner_check"
CHECK (
    (
        ("quote_request_id" IS NOT NULL)::INTEGER +
        ("visit_request_id" IS NOT NULL)::INTEGER +
        ("boq_request_id" IS NOT NULL)::INTEGER
    ) = 1
    OR (
        "status" <> 'ACTIVE'
        AND "quote_request_id" IS NULL
        AND "visit_request_id" IS NULL
        AND "boq_request_id" IS NULL
    )
);

ALTER TABLE "Attachment"
ADD CONSTRAINT "Attachment_file_metadata_check"
CHECK (
    "file_size" > 0
    AND length(btrim("original_filename")) > 0
    AND length(btrim("public_id")) > 0
    AND "resource_type" IN ('image', 'raw')
    AND "delivery_type" = 'authenticated'
);

ALTER TABLE "CloudinaryCleanupOperation"
ADD CONSTRAINT "CloudinaryCleanupOperation_state_check"
CHECK (
    "attempt_count" >= 0
    AND (
        ("status" = 'COMPLETED' AND "completed_at" IS NOT NULL)
        OR ("status" <> 'COMPLETED' AND "completed_at" IS NULL)
    )
);

ALTER TABLE "NotificationAttempt"
ADD CONSTRAINT "NotificationAttempt_identity_check"
CHECK (
    "attempt_number" > 0
    AND length(btrim("request_id")) > 0
    AND (
        (
            "quote_request_id" IS NULL
            AND "visit_request_id" IS NULL
            AND "boq_request_id" IS NULL
        )
        OR (
            "request_type" = 'QUOTE'
            AND "quote_request_id" = "request_id"
            AND "visit_request_id" IS NULL
            AND "boq_request_id" IS NULL
        )
        OR (
            "request_type" = 'VISIT'
            AND "visit_request_id" = "request_id"
            AND "quote_request_id" IS NULL
            AND "boq_request_id" IS NULL
        )
        OR (
            "request_type" = 'BOQ'
            AND "boq_request_id" = "request_id"
            AND "quote_request_id" IS NULL
            AND "visit_request_id" IS NULL
        )
    )
    AND (
        ("status" = 'SENDING' AND "completed_at" IS NULL)
        OR ("status" <> 'SENDING' AND "completed_at" IS NOT NULL)
    )
);

ALTER TABLE "EmailAttachmentAccessToken"
ADD CONSTRAINT "EmailAttachmentAccessToken_lifecycle_check"
CHECK (
    "expires_at" > "issued_at"
    AND (
        "revoked_at" IS NULL
        OR "revoked_at" >= "issued_at"
    )
    AND "token_hash" ~ '^[0-9a-f]{64}$'
);
