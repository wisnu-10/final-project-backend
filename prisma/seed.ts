import {prisma} from "../src/config/prisma-client.config"
import { seedOutlets } from "./seeds/outlet.seed";

async function main() {
  try {
    console.log("🚀 Starting Seeding Process...");

    // Panggil fungsi seed outlet di sini
    await seedOutlets(prisma);

    // Kalau nanti ada seed lain, tinggal tambah di bawahnya
    // await seedUsers(prisma);
    // await seedLaundryItems(prisma);

    console.log("✅ All data seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
