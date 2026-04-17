import { prisma } from "../../../config/prisma-client.config";

export async function expiryScheduleConfirmOrderJob() {
  const scheduleConfirmOrders = await prisma.order.findMany({
    where: {
      scheduleTime: {
        lt: new Date(),
      },
      statusLogs: {
        some: {
          status: "delivering",
        },
      },
    },
  });

  for (const order of scheduleConfirmOrders) {
    await prisma.orderStatus.updateMany({
      where: {
        orderId: order.id,
        status: "delivering",
      },
      data: {
        status: "completed",
      },
    });
  }
}
