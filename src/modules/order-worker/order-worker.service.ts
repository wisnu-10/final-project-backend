import { OrderStatusEnum } from "../../../generated/prisma/enums";
import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";

export const orderWorkerService = {
  /**
   * Get orders assigned to a specific worker (limited view)
   */
  async getWorkerOrders(workerId: string, workerOutletId: string | null) {
    if (!workerOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    const orders = await prisma.order.findMany({
      where: {
        outletId: workerOutletId,
        deletedAt: null,
        statusLogs: {
          some: {
            workerId,
            finishedAt: null,
          },
        },
      },
      select: {
        id: true,
        customer: {
          select: { firstName: true, lastName: true },
        },
        statusLogs: {
          select: {
            status: true,
            workerId: true,
            createdAt: true,
            finishedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => ({
      orderId: order.id,
      customerName: `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim(),
      currentStation: order.statusLogs[0]?.status || "unknown",
      createdAt: order.createdAt,
    }));
  },

  async getAvailableTasks(outletId: string) {
    if (!outletId) throw AppError("You are not assigned to any outlet", 403);

    const orders = await prisma.order.findMany({
      where: {
        outletId,
        statusLogs: {
          some: {
            status: { in: ["washing", "ironing", "packing"] },
            workerId: null,
            finishedAt: null,
          },
        },
        deletedAt: null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        statusLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return orders;
  },

  async acceptTask(workerId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { statusLogs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!order) throw AppError("Order not found", 404);
    const latestLog = order.statusLogs[0];
    if (!latestLog || latestLog.workerId) throw AppError("Task already assigned or invalid", 400);

    return await prisma.orderStatus.update({
      where: { id: latestLog.id },
      data: { workerId },
    });
  },

  async completeTask(workerId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { statusLogs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!order) throw AppError("Order not found", 404);
    const latestLog = order.statusLogs[0];
    if (!latestLog || latestLog.workerId !== workerId) throw AppError("Task not assigned to you", 403);
    const nextStatusMap: Record<OrderStatusEnum, OrderStatusEnum> = {
      washing: "ironing",
      ironing: "packing",
      packing: "waiting_payment",
      scheduled: "scheduled",
      waiting_pickup: "scheduled",
      on_the_way_to_outlet: "scheduled",
      arrived_outlet: "scheduled",
      waiting_payment: "scheduled",
      ready_delivery: "scheduled",
      delivering: "scheduled",
      completed: "scheduled"
    };

    const nextStatus = nextStatusMap[latestLog.status];
    if (!nextStatus) throw AppError("Cannot complete this station here", 400);

    return await prisma.$transaction(async (tx) => {
      await tx.orderStatus.update({
        where: { id: latestLog.id },
        data: { finishedAt: new Date() },
      });

      return await tx.orderStatus.create({
        data: {
          orderId,
          status: nextStatus,
          workerId: null, // Next worker picks it up
          startedAt: new Date(),
        },
      });
    });
  },

  async getWorkHistory(workerId: string) {
    const logs = await prisma.orderStatus.findMany({
      where: {
        workerId,
        finishedAt: { not: null },
        status: { in: ["washing", "ironing", "packing"] },
      },
      include: {
        order: {
          include: {
            customer: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { finishedAt: "desc" },
    });

    return logs;
  },

  /**
   * Get limited order detail for worker
   */
  async getWorkerOrderDetail(
    workerId: string,
    workerOutletId: string | null,
    orderId: string,
  ) {
    // ... (keep existing implementation but update if needed)
    if (!workerOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        outletId: workerOutletId,
        deletedAt: null,
      },
      select: {
        id: true,
        customer: {
          select: { firstName: true, lastName: true },
        },
        orderItems: {
          where: { deletedAt: null },
          select: {
            id: true,
            quantity: true,
            laundryItem: {
              select: { id: true, name: true, pricingType: true },
            },
          },
        },
        statusLogs: {
          select: {
            id: true,
            status: true,
            workerId: true,
            totalItem: true,
            createdAt: true,
            finishedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) throw AppError("Order not found", 404);

    const totalExpectedItems = order.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      orderId: order.id,
      customerName: `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim(),
      currentStation: order.statusLogs[0]?.status || "unknown",
      orderItems: order.orderItems,
      totalExpectedItems,
      statusLogs: order.statusLogs,
    };
  },
};
