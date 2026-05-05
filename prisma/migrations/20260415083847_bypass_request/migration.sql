/*
  Warnings:

  - Added the required column `station` to the `bypass_requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bypass_requests" DROP CONSTRAINT "bypass_requests_approved_by_fkey";

-- AlterTable
ALTER TABLE "bypass_requests" ADD COLUMN     "station" "OrderStatusEnum" NOT NULL,
ALTER COLUMN "approved_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "bypass_requests" ADD CONSTRAINT "bypass_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
