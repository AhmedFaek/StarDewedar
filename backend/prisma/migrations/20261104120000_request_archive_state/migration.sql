ALTER TABLE "QuoteRequest"
ADD COLUMN "archived_at" TIMESTAMP(3);

ALTER TABLE "VisitRequest"
ADD COLUMN "archived_at" TIMESTAMP(3);

ALTER TABLE "BOQRequest"
ADD COLUMN "archived_at" TIMESTAMP(3);

CREATE INDEX "QuoteRequest_archived_at_created_at_idx"
ON "QuoteRequest"("archived_at", "created_at");

CREATE INDEX "VisitRequest_archived_at_created_at_idx"
ON "VisitRequest"("archived_at", "created_at");

CREATE INDEX "BOQRequest_archived_at_created_at_idx"
ON "BOQRequest"("archived_at", "created_at");
