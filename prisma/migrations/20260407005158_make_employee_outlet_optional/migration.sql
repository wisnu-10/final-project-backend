-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_outlet_id_fkey";

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "outlet_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
