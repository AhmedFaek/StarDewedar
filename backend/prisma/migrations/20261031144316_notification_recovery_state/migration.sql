-- AlterTable
ALTER TABLE "BOQRequest" ADD COLUMN     "notification_lease_token" TEXT;

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "notification_lease_token" TEXT;

-- AlterTable
ALTER TABLE "VisitRequest" ADD COLUMN     "notification_lease_token" TEXT;

UPDATE "VisitRequest"
SET "notification_status" = 'unknown'
WHERE "notification_status" = 'pending'
  AND "notification_attempts" = 0
  AND "notification_last_attempt_at" IS NULL
  AND "notification_sent_at" IS NULL
  AND "notification_lease_expires_at" IS NULL
  AND "notification_error_code" IS NULL
  AND "notification_error_message" IS NULL;

UPDATE "QuoteRequest"
SET "notification_status" = 'unknown'
WHERE "notification_status" = 'pending'
  AND "notification_attempts" = 0
  AND "notification_last_attempt_at" IS NULL
  AND "notification_sent_at" IS NULL
  AND "notification_lease_expires_at" IS NULL
  AND "notification_error_code" IS NULL
  AND "notification_error_message" IS NULL;

UPDATE "BOQRequest"
SET "notification_status" = 'unknown'
WHERE "notification_status" = 'pending'
  AND "notification_attempts" = 0
  AND "notification_last_attempt_at" IS NULL
  AND "notification_sent_at" IS NULL
  AND "notification_lease_expires_at" IS NULL
  AND "notification_error_code" IS NULL
  AND "notification_error_message" IS NULL;
