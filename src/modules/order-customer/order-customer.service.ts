import { OrderStatusEnum } from "../../../generated/prisma/enums";
import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { getDistance } from "../../helpers/geodistance.helper";
import {
  CreateOrderPickupDTO,
  GetAllOrderDTO,
} from "../../types/orderCustomer.dto";

export const orderCustomerService = {
  async createOrderPickup(
    customerId: string,
    createOrderPickup: CreateOrderPickupDTO,
  ) {
    /* ============= Cari alamat customer ================= */

    const findCustomer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        addresses: {
          where: {
            id: {
              in: [
                createOrderPickup.pickupAddressId,
                createOrderPickup.deliveryAddressId,
              ],
            },
          },
        },
      },
    });

    if (!findCustomer) throw AppError("Customer not found", 404);

    const findPickupAddress = findCustomer.addresses.find(
      (address: any) => address.id === createOrderPickup.pickupAddressId,
    );

    if (!findPickupAddress) throw AppError("Pickup address not found", 404);

    const findDeliveryAddress = findCustomer.addresses.find(
      (address: any) => address.id === createOrderPickup.deliveryAddressId,
    );

    if (!findDeliveryAddress) throw AppError("Delivery address not found", 404);

    /* ============= Cari Outlet terdekat (dari kotanya dulu) ================= */

    const outlet = await prisma.outlet.findMany({
      where: {
        cityId: {
          in: [findPickupAddress.cityId, findDeliveryAddress.cityId],
        },
      },
    });

    if (outlet.length === 0)
      throw AppError("Outlet not found in pickup city", 404);

    /* ============= Cari Outlet terdekat (dari jarak/distance) ================= */

    const pickupOutletDistances = outlet.map((o: any) => ({
      ...o,
      distance: getDistance(
        Number(findPickupAddress.latitude),
        Number(findPickupAddress.longitude),
        Number(o.latitude),
        Number(o.longitude),
      ),
    }));

    pickupOutletDistances.sort((a, b) => a.distance - b.distance);

    const nearestOutlet = pickupOutletDistances[0];

    if (nearestOutlet.distance > nearestOutlet.maxServiceDistance) {
      throw AppError("The nearest outlet is too far from the address", 400);
    }

    /* ============= Cari Outlet terdekat (dari jarak/distance) berdasarkan alamat delivery ================= */

    const deliveryOutletDistances = outlet.map((o: any) => ({
      ...o,
      distance: getDistance(
        Number(findDeliveryAddress.latitude),
        Number(findDeliveryAddress.longitude),
        Number(o.latitude),
        Number(o.longitude),
      ),
    }));

    deliveryOutletDistances.sort((a, b) => a.distance - b.distance);

    const nearestDeliveryOutlet = deliveryOutletDistances[0];

    if (
      nearestDeliveryOutlet.distance > nearestDeliveryOutlet.maxServiceDistance
    ) {
      throw AppError("The nearest outlet is too far from the address", 400);
    }

    const timestamp = Date.now().toString().slice(-5);
    const customerPart = findCustomer.id.slice(0, 5).toUpperCase();
    const invoiceNumber = `DL-${customerPart}-${timestamp}`;

    return await prisma.order.create({
      data: {
        invoiceNumber: invoiceNumber,
        customerId,
        pickupAddressId: createOrderPickup.pickupAddressId,
        deliveryAddressId: createOrderPickup.deliveryAddressId,
        scheduleTime: new Date(createOrderPickup.scheduleTime),
        outletId: nearestOutlet.id,
        distancePickup: nearestOutlet.distance,
        distanceDelivery: nearestDeliveryOutlet.distance,

        statusLogs: {
          create: {
            status: "waiting_pickup",
          },
        },
        payments: {
          create: {
            status: "pending",
          },
        },
      },
    });
  },

  async getAllOrder(customerId: string, filter: GetAllOrderDTO) {
    const skip = (filter.page - 1) * filter.limit;

    const whereClause: any = {
      customerId: customerId,

      OR: filter.search
        ? [
          {
            outlet: {
              name: { contains: filter.search, mode: "insensitive" },
            },
          },
          {
            pickupAddress: {
              OR: filter.search
                ? [
                  {
                    address: {
                      contains: filter.search,
                      mode: "insensitive",
                    },
                  },
                  {
                    districtName: {
                      contains: filter.search,
                      mode: "insensitive",
                    },
                  },
                  {
                    cityName: {
                      contains: filter.search,
                      mode: "insensitive",
                    },
                  },
                ]
                : undefined,
            },
          },
        ]
        : undefined,

      // status untuk beda model (query pake yang di dto)
      payments: filter.paymentStatus
        ? { status: filter.paymentStatus }
        : undefined,

      // some untuk array
      statusLogs: filter.orderStatus
        ? { some: { status: filter.orderStatus } }
        : undefined,

      createdAt:
        filter.startDate && filter.endDate
          ? {
            gte: new Date(filter.startDate),
            lte: new Date(filter.endDate + "T23:59:59.999Z"),
          }
          : undefined,
    };

    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        skip: skip,
        take: filter.limit,
        orderBy: { createdAt: "desc" }, 
        include: {
          customer: true,
          pickupAddress: {
            select: { address: true, districtName: true, cityName: true },
          },
          deliveryAddress: {
            select: { address: true, districtName: true, cityName: true },
          },
          outlet: true,
          statusLogs: true,
          payments: true,
          orderItems: { include: { laundryItem: true } },
          complaints: true
        },
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    const totalPage = Math.ceil(totalOrders / filter.limit);

    return { orders, totalOrders, totalPage, currentPage: filter.page };
  },

  async getById(customerId: string, id: string) {
    return await prisma.order.findFirst({
      where: {
        customerId: customerId,
        id: id,
      },
      include: {
        pickupAddress: true,
        deliveryAddress: true,
        outlet: true,
        statusLogs: { select: { status: true } },
        payments: true,
        orderItems: { include: { laundryItem: true } },
        complaints: {include: {resolvedBy: true}},
      },
    });
  },

  async scheduledOrderPickup(
    customerId: string,
    scheduledOrderPickup: CreateOrderPickupDTO,
  ) {
    /* ============= Cari alamat customer ================= */

    const findCustomer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        addresses: {
          where: {
            id: {
              in: [
                scheduledOrderPickup.pickupAddressId,
                scheduledOrderPickup.deliveryAddressId,
              ],
            },
          },
        },
      },
    });

    if (!findCustomer) throw AppError("Customer not found", 404);

    const findPickupAddress = findCustomer.addresses.find(
      (address: any) => address.id === scheduledOrderPickup.pickupAddressId,
    );

    if (!findPickupAddress) throw AppError("Pickup address not found", 404);

    const findDeliveryAddress = findCustomer.addresses.find(
      (address: any) => address.id === scheduledOrderPickup.deliveryAddressId,
    );

    if (!findDeliveryAddress) throw AppError("Delivery address not found", 404);

    /* ============= Cari Outlet terdekat (dari kotanya dulu) ================= */

    const outlet = await prisma.outlet.findMany({
      where: {
        cityId: {
          in: [findPickupAddress.cityId, findDeliveryAddress.cityId],
        },
      },
    });

    if (outlet.length === 0)
      throw AppError("Outlet not found in pickup city", 404);

    /* ============= Cari Outlet terdekat (dari jarak/distance) ================= */

    const pickupOutletDistances = outlet.map((o: any) => ({
      ...o,
      distance: getDistance(
        Number(findPickupAddress.latitude),
        Number(findPickupAddress.longitude),
        Number(o.latitude),
        Number(o.longitude),
      ),
    }));

    pickupOutletDistances.sort((a, b) => a.distance - b.distance);

    const nearestOutlet = pickupOutletDistances[0];

    if (nearestOutlet.distance > nearestOutlet.maxServiceDistance) {
      throw AppError(
        "The nearest outlet is too far from the address",
        400,
      );
    }

    /* ============= Cari Outlet terdekat (dari jarak/distance) berdasarkan alamat delivery ================= */

    const deliveryOutletDistances = outlet.map((o: any) => ({
      ...o,
      distance: getDistance(
        Number(findDeliveryAddress.latitude),
        Number(findDeliveryAddress.longitude),
        Number(o.latitude),
        Number(o.longitude),
      ),
    }));

    deliveryOutletDistances.sort((a, b) => a.distance - b.distance);

    const nearestDeliveryOutlet = deliveryOutletDistances[0];

    if (
      nearestDeliveryOutlet.distance > nearestDeliveryOutlet.maxServiceDistance
    ) {
      throw AppError(
        "The nearest outlet is too far from the address",
        400,
      );
    }

    /* ============= set Waktu biar 1 hari =============== */
    const userPickTime = new Date(scheduledOrderPickup.scheduleTime);

    const timestamp = Date.now().toString().slice(-5);
    const customerPart = findCustomer.id.slice(0, 5).toUpperCase();
    const invoiceNumber = `DL-${customerPart}-${timestamp}`;

    return await prisma.order.create({
      data: {
        invoiceNumber: invoiceNumber,
        customerId,
        pickupAddressId: scheduledOrderPickup.pickupAddressId,
        deliveryAddressId: scheduledOrderPickup.deliveryAddressId,
        scheduleTime: userPickTime,
        outletId: nearestOutlet.id,
        distancePickup: nearestOutlet.distance,
        distanceDelivery: nearestDeliveryOutlet.distance,

        statusLogs: {
          create: {
            status: "scheduled",
          },
        },
        payments: {
          create: {
            status: "pending",
          },
        },
      },
    });
  },

  async confirmOrder(customerId: string, id: string) {
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: id,
        customerId: customerId,
        statusLogs: {
          some: {
            status: "delivering",
          },
        },
      },
      include: {
        statusLogs: {
          where: { finishedAt: null },
          take: 1,
        },
      },
    });

    if (!existingOrder) throw AppError("Order not found or not in delivering status", 404);

    return await prisma.$transaction(async (tx) => {
      // Finish active log if exists
      if (existingOrder.statusLogs.length > 0) {
        await tx.orderStatus.update({
          where: { id: existingOrder.statusLogs[0].id },
          data: { finishedAt: new Date() },
        });
      }

      // Create completed log
      await tx.orderStatus.create({
        data: {
          orderId: id,
          status: "completed",
        },
      });

      // Update order timestamp
      return await tx.order.update({
        where: { id: id },
        data: { completedDeliveryAt: new Date() },
      });
    });
  },
};
