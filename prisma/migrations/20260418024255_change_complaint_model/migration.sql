-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "admin_response" TEXT,
ADD COLUMN     "resolved_by_id" UUID;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
