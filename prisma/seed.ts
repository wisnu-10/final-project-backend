import { prisma } from "../src/config/prisma-client.config"
import { seedOutlets } from "./seeds/outlet.seed";
import { seedEmployees } from "./seeds/employee.seed";
import { seedBypassRequests } from "./seeds/bypass-request";
import { laundryItemsSeed } from "./seeds/laundry-items.seed";
import { orderItemsSeed } from "./seeds/order-items.seed";
import { seedDriverOrders } from "./seeds/driver-orders.seed";

async function main() {
  try {
    console.log("🚀 Starting Seeding Process...");

    await seedOutlets(prisma);
    await seedEmployees(prisma);

    // Seed Laundry Items first (needed for worker orders)
    await laundryItemsSeed(prisma)

    // Seed Driver Orders
    await seedDriverOrders(prisma);

    await seedBypassRequests(prisma);

    await orderItemsSeed(prisma)

    // Seed Workers with test orders

    console.log("✅ All data seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
