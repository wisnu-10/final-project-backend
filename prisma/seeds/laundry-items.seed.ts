import { PrismaClient } from "../../generated/prisma/client";
import { PricingType } from "../../generated/prisma/enums";

export async function laundryItemsSeed(prisma: PrismaClient) {
  console.log("🌱 Seeding laundry items...");

  const laundryItems = [
    {
      name: "Cuci Kiloan (Reguler)",
      pricingType: PricingType.kiloan,
      price: 7000,
    },
    {
      name: "Cuci Kiloan (Express 1 Hari)",
      pricingType: PricingType.kiloan,
      price: 12000,
    },
    {
      name: "Cuci Kiloan (Super Express 6 Jam)",
      pricingType: PricingType.kiloan,
      price: 20000,
    },
    {
      name: "Bed Cover (Besar)",
      pricingType: PricingType.per_item,
      price: 35000,
    },
    {
      name: "Boneka Large",
      pricingType: PricingType.per_item,
      price: 25000,
    },
    {
      name: "Sepatu Canvas",
      pricingType: PricingType.per_item,
      price: 30000,
    },
    {
      name: "Jas Setelan",
      pricingType: PricingType.per_item,
      price: 50000,
    },
  ];

  for (const item of laundryItems) {
    await prisma.laundryItem.upsert({
      where: { id: "00000000-0000-0000-0000-000000000000" }, // Karena pake UUID, kita pake upsert kosong atau create aja
      update: {},
      create: {
        name: item.name,
        pricingType: item.pricingType,
        price: item.price,
      },
    });
  }

  console.log("Seeding finished! ✅");
}
