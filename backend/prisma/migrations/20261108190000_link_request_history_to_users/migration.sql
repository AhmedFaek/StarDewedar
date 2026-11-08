ALTER TABLE "QuoteRequest" ADD COLUMN "user_id" TEXT;
ALTER TABLE "VisitRequest" ADD COLUMN "user_id" TEXT;
ALTER TABLE "BOQRequest" ADD COLUMN "user_id" TEXT;

CREATE INDEX "QuoteRequest_user_id_idx" ON "QuoteRequest"("user_id");
CREATE INDEX "VisitRequest_user_id_idx" ON "VisitRequest"("user_id");
CREATE INDEX "BOQRequest_user_id_idx" ON "BOQRequest"("user_id");

ALTER TABLE "QuoteRequest"
ADD CONSTRAINT "QuoteRequest_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VisitRequest"
ADD CONSTRAINT "VisitRequest_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BOQRequest"
ADD CONSTRAINT "BOQRequest_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
