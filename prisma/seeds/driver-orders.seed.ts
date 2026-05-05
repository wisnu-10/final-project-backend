import { PrismaClient } from "../../generated/prisma/client";
import bcrypt from "bcrypt";

export async function seedDriverOrders(prisma: PrismaClient) {
  console.log("🌱 Seeding Driver Orders (Requests, Active, History)...");

  // 1. Get or Create Outlet
  let outlet = await prisma.outlet.findFirst();
  if (!outlet) {
    outlet = await prisma.outlet.create({
      data: {
        name: "diLaundryiin - Main Branch",
        address: "Jl. Utama No. 123, Jakarta",
        districtId: 3171010,
        districtName: "GAMBIR",
        cityId: 3171,
        cityName: "KOTA ADM. JAKARTA PUSAT",
        provinceId: 31,
        provinceName: "DKI JAKARTA",
        postalCode: "10110",
        latitude: -6.1751,
        longitude: 106.8272,
        maxServiceDistance: 15.0,
        isActive: true,
      },
    });
  }

  // 2. Get or Create Driver
  const hashedPassword = await bcrypt.hash("password123", 10);
  let driver = await prisma.employee.findFirst({
    where: { role: "driver", email: "driver@example.com" },
  });
  
  if (!driver) {
    driver = await prisma.employee.create({
      data: {
        firstName: "Budi",
        lastName: "Driver",
        email: "driver@example.com",
        phoneNumber: "081233334444",
        password: hashedPassword,
        role: "driver",
        identityNumber: "3201010101010001",
        bankAccountNumber: "1234567890",
        outletId: outlet.id,
        isVerified: true,
      },
    });
  }

  // 3. Get or Create Customer and Address
  let customer = await prisma.customer.findFirst({
    where: { email: "customer.driver@example.com" },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        firstName: "Ani",
        lastName: "Customer",
        email: "customer.driver@example.com",
        password: hashedPassword,
        phoneNumber: "085566667777",
        isVerified: true,
      },
    });
  }

  let address = await prisma.customerAddress.findFirst({
    where: { customerId: customer.id },
  });

  if (!address) {
    address = await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        recipientName: "Ani Customer",
        recipientPhoneNumber: "085566667777",
        label: "Apartment",
        address: "Apartemen Mediterania, Tower A Lt. 10",
        districtId: 3171010,
        districtName: "GAMBIR",
        cityId: 3171,
        cityName: "KOTA ADM. JAKARTA PUSAT",
        provinceId: 31,
        provinceName: "DKI JAKARTA",
        postalCode: "10110",
        latitude: -6.1760,
        longitude: 106.8280,
        isPrimary: true,
      },
    });
  }

  // 4. Create Orders for different states
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  // Helper to create order with log
  const createOrderWithLog = async (
    orderData: any, 
    status: any, 
    isFinished = false, 
    workerId: string | null = null,
    createdAt: Date = now
  ) => {
    return await prisma.order.create({
      data: {
        ...orderData,
        createdAt,
        statusLogs: {
          create: {
            status,
            startedAt: createdAt,
            finishedAt: isFinished ? now : null,
            workerId: workerId,
          },
        },
      },
    });
  };

  // --- REQUESTS (Available Tasks) ---
  
  // A. Pickup Request (Waiting Pickup)
  await createOrderWithLog({
    outletId: outlet.id,
    customerId: customer.id,
    pickupAddressId: address.id,
    deliveryAddressId: address.id,
    scheduleTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
    distancePickup: 3.2,
    distanceDelivery: 3.2,
  }, "waiting_pickup");

  // B. Delivery Request (Ready Delivery)
  await createOrderWithLog({
    outletId: outlet.id,
    customerId: customer.id,
    pickupAddressId: address.id,
    deliveryAddressId: address.id,
    scheduleTime: yesterday,
    distancePickup: 4.5,
    distanceDelivery: 4.5,
    completedPickupAt: yesterday,
  }, "ready_delivery");


  // --- ACTIVE (My Tasks) ---

  // C. Active Pickup (On The Way to Outlet)
  await createOrderWithLog({
    outletId: outlet.id,
    customerId: customer.id,
    pickupAddressId: address.id,
    deliveryAddressId: address.id,
    scheduleTime: now,
    distancePickup: 2.1,
    distanceDelivery: 2.1,
    driverPickupId: driver.id,
  }, "on_the_way_to_outlet", false, driver.id);

  // D. Active Delivery (Delivering)
  // We need to simulate a second driver/account if we want multiple active tasks, 
  // but usually a driver can only have one active task at a time.
  // However, for seeding purposes we can create it anyway.
  await createOrderWithLog({
    outletId: outlet.id,
    customerId: customer.id,
    pickupAddressId: address.id,
    deliveryAddressId: address.id,
    scheduleTime: yesterday,
    distancePickup: 5.0,
    distanceDelivery: 5.0,
    driverDeliveryId: driver.id,
    completedPickupAt: yesterday,
  }, "delivering", false, driver.id);


  // --- HISTORY ---

  // E. Completed Pickup History
  const histPickup = await prisma.order.create({
    data: {
      outletId: outlet.id,
      customerId: customer.id,
      pickupAddressId: address.id,
      deliveryAddressId: address.id,
      scheduleTime: twoDaysAgo,
      distancePickup: 1.5,
      distanceDelivery: 1.5,
      driverPickupId: driver.id,
      completedPickupAt: twoDaysAgo,
      createdAt: twoDaysAgo,
    }
  });
  await prisma.orderStatus.create({
    data: {
      orderId: histPickup.id,
      status: "arrived_outlet",
      startedAt: twoDaysAgo,
      finishedAt: twoDaysAgo,
      workerId: driver.id
    }
  });

  // F. Completed Delivery History
  const histDelivery = await prisma.order.create({
    data: {
      outletId: outlet.id,
      customerId: customer.id,
      pickupAddressId: address.id,
      deliveryAddressId: address.id,
      scheduleTime: twoDaysAgo,
      distancePickup: 6.2,
      distanceDelivery: 6.2,
      driverDeliveryId: driver.id,
      completedPickupAt: twoDaysAgo,
      completedDeliveryAt: yesterday,
      createdAt: twoDaysAgo,
    }
  });
  await prisma.orderStatus.create({
    data: {
      orderId: histDelivery.id,
      status: "completed",
      startedAt: yesterday,
      finishedAt: yesterday,
      workerId: driver.id
    }
  });

  console.log("✅ Driver Orders seeded successfully!");
}
