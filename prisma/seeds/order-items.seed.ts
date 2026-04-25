import { PrismaClient } from "../../generated/prisma/client";

export async function orderItemsSeed(prisma: PrismaClient) {
  console.log("🌱 Seeding order items...");

  const orderItemsData = [
    {
      orderId: "ca69556b-7831-429d-89a8-d63b35757b23",
      laundryItemId: "f6b1bf0e-8b6a-4589-b8a1-7114b1f0ada2",
      quantity: 3,
      subTotal: 21000,
    },
    {
      orderId: "ca69556b-7831-429d-89a8-d63b35757b23",
      laundryItemId: "ff436d26-cb66-4b93-bdef-00e305271620",
      quantity: 1,
      subTotal: 12000,
    },
    {
      orderId: "ca69556b-7831-429d-89a8-d63b35757b23", //
      laundryItemId: "5281dbe8-69be-499d-ab32-bc246ed58a94",
      quantity: 2,
      subTotal: 70000,
    },
    {
      orderId: "ca69556b-7831-429d-89a8-d63b35757b23", //
      laundryItemId: "37110c70-1711-4311-a1bf-c0be9247a2d6",
      quantity: 2,
      subTotal: 70000,
    },
  ];

  for (const item of orderItemsData) {
    await prisma.orderItem.create({
      data: {
        orderId: item.orderId,
        laundryItemId: item.laundryItemId,
        quantity: item.quantity,
        subTotal: item.subTotal,
      },
    });
  }

  
}
