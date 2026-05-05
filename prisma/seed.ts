import { prisma } from "../src/config/prisma-client.config";
import { seedSuperadmin } from "./seeds/superadmin";

async function main() {
  try {
    console.log("🚀 Starting Seeding Process...");

    await seedSuperadmin();

    console.log("✅ All data seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
