/*
  Warnings:

  - You are about to drop the column `isUnit` on the `laundry_items` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerUnit` on the `laundry_items` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('kiloan', 'per_item');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "laundry_items" DROP COLUMN "isUnit",
DROP COLUMN "pricePerUnit",
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pricing_type" "PricingType" NOT NULL DEFAULT 'kiloan';

-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "employee_id" UUID,
ALTER COLUMN "customer_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
