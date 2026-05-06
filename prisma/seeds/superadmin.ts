import { prisma } from "../../src/config/prisma-client.config";
import * as bcrypt from "bcrypt";

export async function seedSuperadmin() {
  const hashedPassword = await bcrypt.hash("Password123", 10);
  
  const superadmin = await prisma.employee.upsert({
    where: { email: "superadmin@mailinator.com" },
    update: {},
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: "wisnu123@mailinator.com",
      phoneNumber: "081234567890",
      password: hashedPassword,
      role: "super_admin",
      identityNumber: "0000000000000001",
      bankAccountNumber: "0000000000",
      isVerified: true,
    },
  });

  console.log(`✅ Superadmin created: ${superadmin.email}`);
}
