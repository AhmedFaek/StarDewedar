-- DropForeignKey
ALTER TABLE "QuoteRequest" DROP CONSTRAINT "QuoteRequest_product_id_fkey";

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "product_name_ar_snapshot" TEXT,
ADD COLUMN     "product_name_en_snapshot" TEXT;

-- Backfill snapshots from the current catalog names for existing linked requests.
UPDATE "QuoteRequest" AS q
SET
    "product_name_en_snapshot" = p."name_en",
    "product_name_ar_snapshot" = p."name_ar"
FROM "Product" AS p
WHERE q."product_id" = p."id";

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
