import { prisma } from "../../../config/prisma-client.config";

export async function expiryScheduleOrderJob() {

  const scheduledOrders = await prisma.order.findMany({
    where: {
      scheduleTime: {
        lt: new Date(),
      },
      statusLogs: {
        some: {
          status: "scheduled",
        },
      },
    },
  });

  for (const order of scheduledOrders) {
    await prisma.orderStatus.updateMany({
      where: {
        orderId: order.id,
        status: "scheduled",
      },
      data: {
        status: "waiting_pickup",
      },
    });
    console.log(
      `[${new Date().toLocaleTimeString()}] 🕒 CRON: Order ${order.id} has been activated (Scheduled -> Waiting Pickup)`,
    );
  }
}
