import { prisma } from "../src/config/prisma-client.config"
import { seedOutlets } from "./seeds/outlet.seed";
import { seedBypassRequests } from "./seeds/bypass-request";
import { laundryItemsSeed } from "./seeds/laundry-items.seed";
import { orderItemsSeed } from "./seeds/order-items.seed";
import { seedDriverOrders } from "./seeds/driver-orders.seed";

async function main() {
  try {
    console.log("🚀 Starting Seeding Process...");


    await seedOutlets(prisma);

    // Seed Driver Orders
    await seedDriverOrders(prisma);

    await seedBypassRequests(prisma);

    await laundryItemsSeed(prisma)

    await orderItemsSeed(prisma)

    console.log("✅ All data seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
