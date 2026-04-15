import { OrderStatusEnum } from "../../../generated/prisma/enums";
import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";

// Stations where workers can create bypass requests
const WORKER_STATIONS: OrderStatusEnum[] = ["washing", "ironing", "packing"];

// Status flow for auto-advancing after approval
const STATUS_FLOW: OrderStatusEnum[] = [
  "waiting_pickup",
  "on_the_way_to_outlet",
  "arrived_outlet",
  "washing",
  "ironing",
  "packing",
  "waiting_payment",
  "ready_delivery",
  "delivering",
  "completed",
];

export interface CreateBypassRequestDTO {
  notes: string;
  expectedQuantity: number;
  actualQuantity: number;
  station: OrderStatusEnum;
}

export const bypassRequestService = {
  /**
   * Worker creates a bypass request when item count is less than expected
   */
  async createBypassRequest(
    workerId: string,
    workerOutletId: string | null,
    orderId: string,
    data: CreateBypassRequestDTO,
  ) {
    if (!workerOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    if (!WORKER_STATIONS.includes(data.station)) {
      throw AppError(
        `Bypass request can only be created at stations: ${WORKER_STATIONS.join(", ")}`,
        400,
      );
    }

    // Validate order exists and belongs to worker's outlet
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        outletId: workerOutletId,
        deletedAt: null,
      },
      include: {
        statusLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) throw AppError("Order not found", 404);

    // Validate order is at the correct station
    const latestStatus = order.statusLogs[0]?.status;
    if (latestStatus !== data.station) {
      throw AppError(
        `Order is currently at "${latestStatus}", not "${data.station}". Bypass request must match current station.`,
        400,
      );
    }

    // Check if there's already a pending bypass for this order at this station
    const existingPending = await prisma.bypassRequest.findFirst({
      where: {
        orderId,
        station: data.station,
        status: "waiting",
        deletedAt: null,
      },
    });

    if (existingPending) {
      throw AppError(
        "There is already a pending bypass request for this order at this station.",
        400,
      );
    }

    // Validate actual < expected (bypass only needed when items are fewer)
    if (data.actualQuantity >= data.expectedQuantity) {
      throw AppError(
        "Bypass request is only needed when actual quantity is less than expected.",
        400,
      );
    }

    const bypassRequest = await prisma.bypassRequest.create({
      data: {
        orderId,
        requestedBy: workerId,
        notes: data.notes,
        status: "waiting",
        station: data.station,
        expectedQuantity: data.expectedQuantity,
        actualQuantity: data.actualQuantity,
      },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return bypassRequest;
  },

  /**
   * Get all bypass requests for a specific order
   */
  async getBypassRequestsByOrder(
    employeeOutletId: string | null,
    orderId: string,
  ) {
    if (!employeeOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    // Validate order belongs to outlet
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        outletId: employeeOutletId,
        deletedAt: null,
      },
    });

    if (!order) throw AppError("Order not found", 404);

    return prisma.bypassRequest.findMany({
      where: {
        orderId,
        deletedAt: null,
      },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true },
        },
        approver: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get all pending bypass requests for an outlet (outlet admin view)
   */
  async getPendingBypassRequests(outletId: string | null) {
    if (!outletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    return prisma.bypassRequest.findMany({
      where: {
        status: "waiting",
        deletedAt: null,
        order: {
          outletId,
          deletedAt: null,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            customer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Outlet admin approves a bypass request → auto-advance order to next station
   */
  async approveBypassRequest(
    adminId: string,
    adminOutletId: string | null,
    bypassRequestId: string,
  ) {
    if (!adminOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    const bypassReq = await prisma.bypassRequest.findFirst({
      where: {
        id: bypassRequestId,
        status: "waiting",
        deletedAt: null,
        order: {
          outletId: adminOutletId,
          deletedAt: null,
        },
      },
      include: {
        order: {
          include: {
            statusLogs: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!bypassReq) {
      throw AppError("Bypass request not found or already processed", 404);
    }

    // Determine next station
    const currentStation = bypassReq.station;
    const currentIdx = STATUS_FLOW.indexOf(currentStation);
    const nextStation = STATUS_FLOW[currentIdx + 1];

    if (!nextStation) {
      throw AppError("Cannot advance beyond the final station", 400);
    }

    await prisma.$transaction(async (tx) => {
      // Update bypass request
      await tx.bypassRequest.update({
        where: { id: bypassRequestId },
        data: {
          status: "approved",
          approvedBy: adminId,
          approvedAt: new Date(),
        },
      });

      // Finish current status log
      const currentLog = bypassReq.order.statusLogs[0];
      if (currentLog) {
        await tx.orderStatus.update({
          where: { id: currentLog.id },
          data: { finishedAt: new Date() },
        });
      }

      // Create new status log for the next station
      await tx.orderStatus.create({
        data: {
          orderId: bypassReq.orderId,
          status: nextStation,
          workerId: currentLog?.workerId,
          startedAt: new Date(),
        },
      });
    });

    return {
      message: `Bypass request approved. Order advanced to "${nextStation}".`,
    };
  },

  /**
   * Outlet admin rejects a bypass request → worker must re-input
   */
  async rejectBypassRequest(
    adminId: string,
    adminOutletId: string | null,
    bypassRequestId: string,
  ) {
    if (!adminOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    const bypassReq = await prisma.bypassRequest.findFirst({
      where: {
        id: bypassRequestId,
        status: "waiting",
        deletedAt: null,
        order: {
          outletId: adminOutletId,
          deletedAt: null,
        },
      },
    });

    if (!bypassReq) {
      throw AppError("Bypass request not found or already processed", 404);
    }

    await prisma.bypassRequest.update({
      where: { id: bypassRequestId },
      data: {
        status: "rejected",
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    return { message: "Bypass request rejected. Worker must re-input the correct data." };
  },
};
