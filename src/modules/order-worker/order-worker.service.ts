import { OrderStatusEnum } from "../../../generated/prisma/enums";
import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";

// Worker-processable stations (order they work on at their station)
const WORKER_STATIONS: OrderStatusEnum[] = ["washing", "ironing", "packing"];

export const orderWorkerService = {
  /**
   * Get all orders available for a worker at their outlet
   * These are orders at arrived_outlet/washing/ironing/packing with NO worker assigned
   */
  async getAvailableTasks(workerOutletId: string) {
    if (!workerOutletId) throw AppError("You are not assigned to any outlet", 403);

    return prisma.order.findMany({
      where: {
        outletId: workerOutletId,
        deletedAt: null,
        statusLogs: {
          some: {
            status: { in: ["arrived_outlet", "washing", "ironing", "packing"] },
            finishedAt: null,
            workerId: null,
          },
        },
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        orderItems: { include: { laundryItem: true } },
        statusLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Get active tasks assigned to this specific worker
   */
  async getMyTasks(workerId: string) {
    return prisma.order.findMany({
      where: {
        deletedAt: null,
        statusLogs: {
          some: {
            workerId,
            finishedAt: null,
            status: { in: ["arrived_outlet", "washing", "ironing", "packing"] },
          },
        },
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        orderItems: { include: { laundryItem: true } },
        statusLogs: { orderBy: { createdAt: "desc" } },
        bypassRequests: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        payments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Worker accepts (claims) an available task
   */
  async acceptTask(workerId: string, orderId: string, workerOutletId: string) {
    if (!workerOutletId) throw AppError("You are not assigned to any outlet", 403);

    const order = await prisma.order.findFirst({
      where: { id: orderId, outletId: workerOutletId, deletedAt: null },
      include: { statusLogs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!order) throw AppError("Order not found", 404);

    const activeLog = order.statusLogs[0];
    if (!activeLog || activeLog.finishedAt) throw AppError("No active status found", 400);
    if (activeLog.workerId) throw AppError("Task already taken by another worker", 400);

    // If the order is at arrived_outlet, transition it to washing first
    if (activeLog.status === "arrived_outlet") {
      return prisma.$transaction(async (tx) => {
        // Finish arrived_outlet
        await tx.orderStatus.update({
          where: { id: activeLog.id },
          data: { finishedAt: new Date() },
        });

        // Create washing status with this worker assigned
        await tx.orderStatus.create({
          data: {
            orderId,
            status: "washing",
            workerId,
            startedAt: new Date(),
          },
        });

        return { success: true, message: "Task accepted, moved to washing" };
      });
    }

    // Otherwise just assign the worker to the current status
    await prisma.orderStatus.update({
      where: { id: activeLog.id },
      data: { workerId, startedAt: new Date() },
    });

    return { success: true, message: "Task accepted" };
  },

  /**
   * Worker completes current station and advances order to next station.
   * At packing: checks payment status to decide next state.
   */
  async completeTask(workerId: string, orderId: string) {
    const activeLog = await prisma.orderStatus.findFirst({
      where: { orderId, workerId, finishedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!activeLog) throw AppError("No active task found for you on this order", 404);

    // Determine next status based on current station
    let nextStatus: OrderStatusEnum | null = null;

    if (activeLog.status === "washing") {
      nextStatus = "ironing";
    } else if (activeLog.status === "ironing") {
      nextStatus = "packing";
    } else if (activeLog.status === "packing") {
      // Special case: check payment status
      const payment = await prisma.payment.findFirst({
        where: { orderId, deletedAt: null, status: "paid" },
      });

      nextStatus = payment ? "ready_delivery" : "waiting_payment";
    }

    return prisma.$transaction(async (tx) => {
      // Finish current station
      await tx.orderStatus.update({
        where: { id: activeLog.id },
        data: { finishedAt: new Date() },
      });

      // Create next station if applicable
      if (nextStatus) {
        await tx.orderStatus.create({
          data: {
            orderId,
            status: nextStatus,
            startedAt: new Date(),
          },
        });
      }

      return { success: true, nextStatus };
    });
  },

  /**
   * Get order detail with full item list for item verification
   */
  async getOrderDetail(orderId: string, workerOutletId: string) {
    if (!workerOutletId) throw AppError("You are not assigned to any outlet", 403);

    const order = await prisma.order.findFirst({
      where: { id: orderId, outletId: workerOutletId, deletedAt: null },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        orderItems: { include: { laundryItem: true } },
        statusLogs: { orderBy: { createdAt: "desc" } },
        bypassRequests: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) throw AppError("Order not found", 404);
    return order;
  },

  /**
   * Worker history: orders where this worker completed a station
   */
  async getWorkerHistory(workerId: string) {
    return prisma.order.findMany({
      where: {
        statusLogs: {
          some: {
            workerId,
            finishedAt: { not: null },
          },
        },
        deletedAt: null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        statusLogs: {
          where: { workerId },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  },
};