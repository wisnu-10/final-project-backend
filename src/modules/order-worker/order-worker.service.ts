import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";

export const orderWorkerService = {
  /**
   * Get orders assigned to a specific worker (limited view)
   * Only returns: orderId, customer name, current station, bypass status
   */
  async getWorkerOrders(workerId: string, workerOutletId: string | null) {
    if (!workerOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    // Find orders where this worker is assigned in any status log
    const orders = await prisma.order.findMany({
      where: {
        outletId: workerOutletId,
        deletedAt: null,
        statusLogs: {
          some: {
            workerId,
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
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        bypassRequests: {
          where: {
            deletedAt: null,
            status: "waiting",
          },
          select: {
            id: true,
            status: true,
            station: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to simplified format
    return orders.map((order) => ({
      orderId: order.id,
      customerName: `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim(),
      currentStation: order.statusLogs[0]?.status || "unknown",
      hasPendingBypass: order.bypassRequests.length > 0,
      createdAt: order.createdAt,
    }));
  },

  /**
   * Get limited order detail for worker:
   * - Customer name, Order ID
   * - Laundry items with expected quantities
   * - Bypass request status
   */
  async getWorkerOrderDetail(
    workerId: string,
    workerOutletId: string | null,
    orderId: string,
  ) {
    if (!workerOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        outletId: workerOutletId,
        deletedAt: null,
        statusLogs: {
          some: {
            workerId,
          },
        },
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
          },
          orderBy: { createdAt: "desc" },
        },
        bypassRequests: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            station: true,
            notes: true,
            expectedQuantity: true,
            actualQuantity: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) throw AppError("Order not found or not assigned to you", 404);

    const latestStatus = order.statusLogs[0]?.status || "unknown";

    // Calculate total expected items
    const totalExpectedItems = order.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      orderId: order.id,
      customerName: `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim(),
      currentStation: latestStatus,
      orderItems: order.orderItems,
      totalExpectedItems,
      bypassRequests: order.bypassRequests,
    };
  },
};
