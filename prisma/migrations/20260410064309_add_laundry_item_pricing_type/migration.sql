/*
  Warnings:

  - You are about to drop the column `expired_at` on the `payments` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('kiloan', 'per_item');

-- AlterTable
ALTER TABLE "laundry_items" ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pricing_type" "PricingType" NOT NULL DEFAULT 'kiloan';

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "subTotal" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "expired_at",
ADD COLUMN     "last_reminder_sent_at" TIMESTAMP(3),
ADD COLUMN     "reminderSentCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "method" DROP NOT NULL,
ALTER COLUMN "gateway_transaction_id" DROP NOT NULL,
ALTER COLUMN "payment_url" DROP NOT NULL;
