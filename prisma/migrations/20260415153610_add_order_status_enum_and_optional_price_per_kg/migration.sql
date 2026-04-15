-- AlterEnum
ALTER TYPE "OrderStatusEnum" ADD VALUE 'scheduled';

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "price_per_kg" DROP NOT NULL;
