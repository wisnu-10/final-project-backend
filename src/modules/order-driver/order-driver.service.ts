import { OrderStatusEnum } from "../../../generated/prisma/enums";
import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";

export const orderDriverService = {
  async getAvailableTasks(outletId: string) {
    if (!outletId) throw AppError("You are not assigned to any outlet", 403);

    const pickups = await prisma.order.findMany({
      where: {
        outletId,
        statusLogs: {
          some: {
            status: "waiting_pickup",
            finishedAt: null,
          },
        },
        driverPickupId: null,
        deletedAt: null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        pickupAddress: true,
      },
    });

    const deliveries = await prisma.order.findMany({
      where: {
        outletId,
        statusLogs: {
          some: {
            status: "ready_delivery",
            finishedAt: null,
          },
        },
        driverDeliveryId: null,
        deletedAt: null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        deliveryAddress: true,
      },
    });

    return { pickups, deliveries };
  },

  async getMyTasks(driverId: string) {
    const activeTasks = await prisma.order.findMany({
      where: {
        OR: [
          {
            driverPickupId: driverId,
            statusLogs: {
              some: {
                status: "on_the_way_to_outlet",
                finishedAt: null,
              },
            },
          },
          {
            driverDeliveryId: driverId,
            statusLogs: {
              some: {
                status: "delivering",
                finishedAt: null,
              },
            },
          },
        ],
        deletedAt: null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        pickupAddress: true,
        deliveryAddress: true,
      },
    });

    return activeTasks;
  },

  async checkActiveOrders(driverId: string) {
    const activeOrders = await prisma.order.findMany({
      where: {
        OR: [
          {
            driverPickupId: driverId,
            statusLogs: {
              some: {
                status: "on_the_way_to_outlet",
                finishedAt: null,
              },
            },
          },
          {
            driverDeliveryId: driverId,
            statusLogs: {
              some: {
                status: "delivering",
                finishedAt: null,
              },
            },
          },
        ],
        deletedAt: null,
      },
    });
    return activeOrders.length > 0;
  },

  async acceptPickup(driverId: string, orderId: string) {
    // Check if driver already has active orders
    const hasActiveOrders = await this.checkActiveOrders(driverId);
    if (hasActiveOrders) {
      throw AppError("Anda masih memiliki pesanan aktif. Selesaikan terlebih dahulu.", 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { statusLogs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!order) throw AppError("Order not found", 404);
    if (order.driverPickupId) throw AppError("Order already has a driver for pickup", 400);
    if (order.statusLogs[0]?.status !== "waiting_pickup") throw AppError("Order is not waiting for pickup", 400);

    return await prisma.$transaction(async (tx) => {
      // Finish current log
      await tx.orderStatus.update({
        where: { id: order.statusLogs[0].id },
        data: { finishedAt: new Date() },
      });

      // Create new log
      await tx.orderStatus.create({
        data: {
          orderId,
          status: "on_the_way_to_outlet",
          workerId: driverId, // We use workerId to track who moved the status
          startedAt: new Date(),
        },
      });

      return await tx.order.update({
        where: { id: orderId },
        data: { driverPickupId: driverId },
      });
    });
  },

  async completePickup(driverId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { statusLogs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!order || order.driverPickupId !== driverId) throw AppError("Task not assigned to you", 403);
    if (order.statusLogs[0]?.status !== "on_the_way_to_outlet") throw AppError("Invalid status flow", 400);

    return await prisma.$transaction(async (tx) => {
      await tx.orderStatus.update({
        where: { id: order.statusLogs[0].id },
        data: { finishedAt: new Date() },
      });

      await tx.orderStatus.create({
        data: {
          orderId,
          status: "arrived_outlet",
          workerId: driverId,
          startedAt: new Date(),
        },
      });

      return await tx.order.update({
        where: { id: orderId },
        data: { completedPickupAt: new Date() },
      });
    });
  },

  async acceptDelivery(driverId: string, orderId: string) {
    // Check if driver already has active orders
    const hasActiveOrders = await this.checkActiveOrders(driverId);
    if (hasActiveOrders) {
      throw AppError("Anda masih memiliki pesanan aktif. Selesaikan terlebih dahulu.", 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { statusLogs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!order) throw AppError("Order not found", 404);
    if (order.driverDeliveryId) throw AppError("Order already has a driver for delivery", 400);
    if (order.statusLogs[0]?.status !== "ready_delivery") throw AppError("Order is not ready for delivery", 400);

    return await prisma.$transaction(async (tx) => {
      await tx.orderStatus.update({
        where: { id: order.statusLogs[0].id },
        data: { finishedAt: new Date() },
      });

      await tx.orderStatus.create({
        data: {
          orderId,
          status: "delivering",
          workerId: driverId,
          startedAt: new Date(),
        },
      });

      return await tx.order.update({
        where: { id: orderId },
        data: {
          driverDeliveryId: driverId,
        },
      });
    });
  },

  async completeDelivery(driverId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { statusLogs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!order || order.driverDeliveryId !== driverId) throw AppError("Task not assigned to you", 403);
    if (order.statusLogs[0]?.status !== "delivering") throw AppError("Invalid status flow", 400);

    return await prisma.$transaction(async (tx) => {
      await tx.orderStatus.update({
        where: { id: order.statusLogs[0].id },
        data: { finishedAt: new Date() },
      });

      return await tx.order.update({
        where: { id: orderId },
        data: { completedDeliveryAt: new Date() },
      });
    });
  },

  async getDriverHistory(driverId: string) {
    const history = await prisma.order.findMany({
      where: {
        OR: [
          { driverPickupId: driverId, completedPickupAt: { not: null } },
          { driverDeliveryId: driverId, completedDeliveryAt: { not: null } },
        ],
        deletedAt: null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        statusLogs: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return history;
  },

  async getAvailableOrdersForStream(outletId: string) {
    const pickups = await prisma.order.findMany({
      where: {
        outletId,
        statusLogs: {
          some: {
            status: "waiting_pickup",
            finishedAt: null,
          },
        },
        driverPickupId: null,
        deletedAt: null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        pickupAddress: true,
        statusLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const deliveries = await prisma.order.findMany({
      where: {
        outletId,
        statusLogs: {
          some: {
            status: "ready_delivery",
            finishedAt: null,
          },
        },
        driverDeliveryId: null,
        deletedAt: null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        deliveryAddress: true,
        statusLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return { pickups, deliveries };
  },
};
