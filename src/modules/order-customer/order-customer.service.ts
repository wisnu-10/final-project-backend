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
        cityName: {
          in: [findPickupAddress.cityName, findDeliveryAddress.cityName],
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
        `The nearest outlet is too far from the pickup address. Distance: ${nearestOutlet.distance} km, Max Service Distance: ${nearestOutlet.maxServiceDistance} km`,
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
        `The nearest outlet is too far from the delivery address. Distance: ${nearestDeliveryOutlet.distance} km, Max Service Distance: ${nearestDeliveryOutlet.maxServiceDistance} km`,
        400,
      );
    }

    return await prisma.order.create({
      data: {
        customerId,
        pickupAddressId: createOrderPickup.pickupAddressId,
        deliveryAddressId: createOrderPickup.deliveryAddressId,
        scheduleTime: new Date(createOrderPickup.scheduleTime), // Pastiin jadi objek Date
        outletId: nearestOutlet.id,
        distancePickup: nearestOutlet.distance,
        distanceDelivery: nearestDeliveryOutlet.distance,

        // Lu harus isi pricePerKg karena di model lu WAJIB (Required)
        pricePerKg: nearestOutlet.pricePerKg || 10000,

        statusLogs: {
          create: {
            status: "waiting_pickup",
          },
        },
      },
    });
  },

  async getAllOrder(customerId: string, filter: GetAllOrderDTO) {
    const skip = (filter.page - 1) * filter.limit;

    const whereClause: any = {
      customerId: customerId,
      // Filter buat Search (misal nyari berdasarkan ID Order atau nama Outlet)
      OR: filter.search
        ? [
            {
              id: { contains: filter.search, mode: "insensitive" },
            },
            {
              outlet: {
                name: { contains: filter.search, mode: "insensitive" },
              },
            },
          ]
        : undefined,

      // 2. Filter Payment Status
      payment: filter.paymentStatus
        ? { status: filter.paymentStatus }
        : undefined,

      // 3. Filter Order Status
      statusLogs: filter.orderStatus
        ? { some: { status: filter.orderStatus } }
        : undefined,

      // 4. Filter Range Tanggal
      createdAt:
        filter.startDate && filter.endDate
          ? {
              gte: new Date(filter.startDate),
              lte: new Date(filter.endDate + "T23:59:59.999Z"),
            }
          : undefined,
    };

    const [count, totalCount] = await prisma.$transaction(async (tx: any) => {
      const count = await tx.order.findMany({
        where: whereClause,
        skip: skip,
        take: filter.limit,
        include: {
          pickupAddress: {
            select: {
              address: true,
              districtName: true,
              cityName: true,
            },
          },
          deliveryAddress: {
            select: {
              address: true,
              districtName: true,
              cityName: true,
            },
          },
          statusLogs: {
            select: {
              status: true,
            },
          },
          payment: {
            select: {
              status: true,
            },
          },
        },
      });

      const totalCount = await tx.order.count({
        where: whereClause,
      });

      return [count, totalCount];
    });

    const totalPage = Math.ceil(totalCount / filter.limit);

    return [count, totalCount, totalPage];
  },
};
