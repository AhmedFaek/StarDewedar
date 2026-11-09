-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "customer_last_seen_at" TIMESTAMP(3);

-- Backfill: existing conversations must not notify for pre-existing admin replies
UPDATE "Conversation"
SET "customer_last_seen_at" = "last_message_at"
WHERE "last_message_at" IS NOT NULL;
