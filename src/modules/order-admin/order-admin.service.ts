import { OrderStatusEnum } from "../../../generated/prisma/enums";
import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import {
  GetAllOrderAdminDTO,
  ProcessOrderDTO,
  UpdateOrderStatusDTO,
  CreateManualOrderDTO,
} from "../../types/order-admin.dto";

// Status yang boleh di-advance oleh outlet admin (tidak termasuk completed)
const OUTLET_ADMIN_ALLOWED_STATUSES: OrderStatusEnum[] = [
  "washing",
  "ironing",
  "packing",
  "waiting_payment",
  "ready_delivery",
  "delivering",
];

// Urutan status untuk validasi flow
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

export const orderAdminService = {
  async getAllOrders(
    employeeRole: string,
    employeeOutletId: string | null,
    filters: GetAllOrderAdminDTO,
  ) {
    const skip = (filters.page - 1) * filters.limit;

    const whereClause: any = {
      deletedAt: null,
    };

    // Outlet Admin: hanya lihat order outlet sendiri
    if (employeeRole === "outlet_admin") {
      if (!employeeOutletId) {
        throw AppError("You are not assigned to any outlet", 403);
      }
      whereClause.outletId = employeeOutletId;
    }

    // Super Admin: bisa filter by outlet
    if (employeeRole === "super_admin" && filters.outletId) {
      whereClause.outletId = filters.outletId;
    }

    // Filter by order status (latest status)
    if (filters.orderStatus) {
      whereClause.statusLogs = {
        some: { status: filters.orderStatus },
      };
    }

    // Filter by worker
    if (filters.workerId) {
      whereClause.statusLogs = {
        ...whereClause.statusLogs,
        some: {
          ...whereClause.statusLogs?.some,
          workerId: filters.workerId,
        },
      };
    }

    // Filter by date range
    if (filters.startDate && filters.endDate) {
      whereClause.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate + "T23:59:59.999Z"),
      };
    }

    // Search
    if (filters.search) {
      whereClause.OR = [
        {
          customer: {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
        {
          outlet: {
            name: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        skip,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          outlet: { select: { id: true, name: true } },
          statusLogs: {
            select: {
              id: true,
              status: true,
              workerId: true,
              startedAt: true,
              finishedAt: true,
              createdAt: true,
              worker: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          orderItems: {
            where: { deletedAt: null },
            select: {
              id: true,
              quantity: true,
              subTotal: true,
              laundryItem: {
                select: {
                  id: true,
                  name: true,
                  pricingType: true,
                  price: true,
                },
              },
            },
          },
          payments: {
            select: { id: true, status: true, amount: true, paidAt: true },
          },
        },
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalOrders / filters.limit);

    return {
      orders,
      pagination: {
        total: totalOrders,
        page: filters.page,
        limit: filters.limit,
        totalPages,
      },
    };
  },

  async getOrderById(
    employeeRole: string,
    employeeOutletId: string | null,
    orderId: string,
  ) {
    const whereClause: any = {
      id: orderId,
      deletedAt: null,
    };

    // Outlet Admin: hanya bisa lihat order outlet sendiri
    if (employeeRole === "outlet_admin") {
      if (!employeeOutletId) {
        throw AppError("You are not assigned to any outlet", 403);
      }
      whereClause.outletId = employeeOutletId;
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        outlet: { select: { id: true, name: true, address: true } },
        admin: {
          select: { id: true, firstName: true, lastName: true },
        },
        pickupAddress: true,
        deliveryAddress: true,
        statusLogs: {
          select: {
            id: true,
            status: true,
            totalItem: true,
            workerId: true,
            startedAt: true,
            finishedAt: true,
            createdAt: true,
            worker: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        orderItems: {
          where: { deletedAt: null },
          select: {
            id: true,
            quantity: true,
            subTotal: true,
            laundryItem: {
              select: { id: true, name: true, pricingType: true, price: true },
            },
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            amount: true,
            method: true,
            paidAt: true,
          },
        },
      },
    });

    if (!order) throw AppError("Order not found", 404);

    return order;
  },

  async processOrder(
    employeeId: string,
    employeeOutletId: string | null,
    orderId: string,
    data: ProcessOrderDTO,
  ) {
    if (!employeeOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    // Cari order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        outletId: employeeOutletId,
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

    // Validasi status harus arrived_outlet
    const latestStatus = order.statusLogs[0]?.status;
    if (latestStatus !== "arrived_outlet") {
      throw AppError(
        `Order cannot be processed. Current status is "${latestStatus}". Only orders with status "arrived_outlet" can be processed.`,
        400,
      );
    }

    // Validasi worker exists
    const worker = await prisma.employee.findFirst({
      where: { id: data.workerId, outletId: employeeOutletId, deletedAt: null },
    });
    if (!worker) throw AppError("Worker not found", 404);

    // Validasi laundry items exist
    const laundryItemIds = data.orderItems.map((item) => item.laundryItemId);
    const laundryItems = await prisma.laundryItem.findMany({
      where: {
        id: { in: laundryItemIds },
        deletedAt: null,
      },
    });

    if (laundryItems.length !== laundryItemIds.length) {
      throw AppError("One or more laundry items not found", 404);
    }

    // Hitung total price
    let totalItemPrice = 0;
    const orderItemsData = data.orderItems.map((item) => {
      const laundryItem = laundryItems.find(
        (li) => li.id === item.laundryItemId,
      );
      if (!laundryItem)
        throw AppError(`Laundry item ${item.laundryItemId} not found`, 404);

      let subTotal = 0;
      if (laundryItem.pricingType === "per_item") {
        subTotal = Number(laundryItem.price) * item.quantity;
      }

      totalItemPrice += subTotal;

      return {
        orderId,
        laundryItemId: item.laundryItemId,
        quantity: item.quantity,
        subTotal,
      };
    });

    const weightPrice = data.totalWeight * Number(order.pricePerKg);
    const totalPrice = weightPrice + totalItemPrice;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          adminId: employeeId,
          totalWeight: data.totalWeight,
          totalPrice: totalPrice,
        },
      });

      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      // Finish previous log (arrived_outlet)
      const prevLog = order.statusLogs[0];
      if (prevLog) {
        await tx.orderStatus.update({
          where: { id: prevLog.id },
          data: { finishedAt: new Date() },
        });
      }

      // Create new status log → washing
      await tx.orderStatus.create({
        data: {
          orderId,
          status: "washing",
          workerId: data.workerId,
          startedAt: new Date(),
        },
      });

      await tx.payment.updateMany({
        where: { orderId },
        data: { amount: totalPrice },
      });

      return updated;
    });

    return updatedOrder;
  },

  async createManualOrder(
    employeeId: string,
    employeeOutletId: string | null,
    data: CreateManualOrderDTO,
  ) {
    if (!employeeOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    // 1. Get current pricePerKg from laundry item named "Laundry Kiloan" or similar
    const kiloanItem = await prisma.laundryItem.findFirst({
      where: {
        pricingType: "kiloan",
        deletedAt: null,
      },
    });

    if (!kiloanItem) {
      throw AppError("Laundry Kiloan pricing not found in system", 400);
    }

    // 2. Validate laundry items exist
    const laundryItemIds = data.orderItems.map((item) => item.laundryItemId);
    const laundryItems = await prisma.laundryItem.findMany({
      where: {
        id: { in: laundryItemIds },
        deletedAt: null,
      },
    });

    // 3. Calc price
    let totalItemPrice = 0;
    data.orderItems.forEach((item) => {
      const li = laundryItems.find((l) => l.id === item.laundryItemId);
      if (li && li.pricingType === "per_item") {
        totalItemPrice += Number(li.price) * item.quantity;
      }
    });

    const weightPrice = data.totalWeight * Number(kiloanItem.price);
    const totalPrice = weightPrice + totalItemPrice;

    // 4. Get Customer Primary Address (Required by DB Schema)
    const customerAddress = await prisma.customerAddress.findFirst({
      where: {
        customerId: data.customerId,
        deletedAt: null,
      },
      orderBy: { isPrimary: "desc" }, // Get primary first
    });

    if (!customerAddress) {
      throw AppError(
        "This customer has no registered address. Please add an address to the customer profile first.",
        400,
      );
    }

    // 5. Create Transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // Create Order
      const order = await tx.order.create({
        data: {
          customerId: data.customerId,
          outletId: employeeOutletId,
          adminId: employeeId,
          pricePerKg: kiloanItem.price,
          totalWeight: data.totalWeight,
          totalPrice: totalPrice,
          pickupAddressId: customerAddress.id,
          deliveryAddressId: customerAddress.id,
          scheduleTime: new Date(),
          distancePickup: 0,
          distanceDelivery: 0,
        },
      });

      // Create Order Items
      const orderItemsData = data.orderItems.map((item) => {
        const li = laundryItems.find((l) => l.id === item.laundryItemId);
        let subTotal = 0;
        if (li && li.pricingType === "per_item") {
          subTotal = Number(li.price) * item.quantity;
        }
        return {
          orderId: order.id,
          laundryItemId: item.laundryItemId,
          quantity: item.quantity,
          subTotal,
        };
      });

      await tx.orderItem.createMany({ data: orderItemsData });

      // Create Status Log
      await tx.orderStatus.create({
        data: {
          orderId: order.id,
          status: "washing",
          workerId: data.workerId,
          startedAt: new Date(),
        },
      });

      // Create Payment Record (Pending)
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalPrice,
          status: "pending",
        },
      });

      return order;
    });

    return newOrder;
  },

  async updateOrderStatus(
    employeeId: string,
    employeeOutletId: string | null,
    orderId: string,
    data: UpdateOrderStatusDTO,
  ) {
    if (!employeeOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    if (!OUTLET_ADMIN_ALLOWED_STATUSES.includes(data.status)) {
      throw AppError(
        `Outlet admin cannot set status to "${data.status}". Status "completed" can only be set by the customer.`,
        403,
      );
    }

    const worker = await prisma.employee.findFirst({
      where: {
        id: data.workerId,
        outletId: employeeOutletId,
        deletedAt: null,
      },
    });

    if (!worker) {
      throw AppError("Worker not found or not assigned to this outlet", 404);
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, outletId: employeeOutletId, deletedAt: null },
      include: {
        statusLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!order) throw AppError("Order not found", 404);

    const latestStatus = order.statusLogs[0]?.status;
    const currentIdx = STATUS_FLOW.indexOf(latestStatus);
    const newIdx = STATUS_FLOW.indexOf(data.status);

    if (newIdx <= currentIdx) {
      throw AppError(
        `Cannot change status from "${latestStatus}" to "${data.status}". Status can only move forward.`,
        400,
      );
    }

    const previousLog = order.statusLogs[0];

    await prisma.$transaction(async (tx) => {
      if (previousLog) {
        await tx.orderStatus.update({
          where: { id: previousLog.id },
          data: { finishedAt: new Date() },
        });
      }

      await tx.orderStatus.create({
        data: {
          orderId,
          status: data.status,
          workerId: data.workerId,
          startedAt: new Date(),
        },
      });
    });

    return { message: `Order status updated to "${data.status}"` };
  },

  async getOutletWorkers(outletId: string) {
    return prisma.employee.findMany({
      where: {
        outletId,
        role: { in: ["worker", "outlet_admin"] },
        deletedAt: null,
      },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: { firstName: "asc" },
    });
  },

  async getCustomers(search?: string) {
    return prisma.customer.findMany({
      where: {
        deletedAt: null,
        OR: search
          ? [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 20,
    });
  },
};
