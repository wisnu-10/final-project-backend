import { prisma } from "../../../config/prisma-client.config";

export async function expiryScheduleConfirmOrderJob() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Find orders where the active 'delivering' status log is older than 3 days
  const ordersToConfirm = await prisma.order.findMany({
    where: {
      statusLogs: {
        some: {
          status: "delivering",
          finishedAt: {
            lt: threeDaysAgo,
            not: null,
          },
        },
        none: {
          status: "completed",
        },
      },
    },
  });

  for (const order of ordersToConfirm) {
    console.log(`[CRON]: Auto-confirming order ${order.id} (3-day timeout)`);
    await prisma.$transaction(async (tx) => {
      // Find the current active log (if any)
      const activeLog = await tx.orderStatus.findFirst({
        where: {
          orderId: order.id,
          finishedAt: null,
        },
      });

      if (activeLog) {
        // Finish the active log
        await tx.orderStatus.update({
          where: { id: activeLog.id },
          data: { finishedAt: new Date() },
        });
      }

      // Create completed log
      await tx.orderStatus.create({
        data: {
          orderId: order.id,
          status: "completed",
          startedAt: new Date(),
          finishedAt: new Date(),
        },
      });

      // Update order timestamps if necessary
      await tx.order.update({
        where: { id: order.id },
        data: { completedDeliveryAt: new Date() },
      });
    });
  }
}
