import { PrismaClient } from "../../generated/prisma/client";

export async function seedOutlets(prisma: PrismaClient) {
  console.log("🌱 Seeding Outlets...");

  const outlets = [
    {
      name: "diLaudnryiin - BSD City",
      address: "Jl. BSD Grand Boulevard No.1",
      districtId: 159,
      districtName: "Pagedangan",
      cityId: 457,
      cityName: "Tangerang Kabupaten",
      provinceId: 3,
      provinceName: "Banten",
      postalCode: "15339",
      latitude: -6.3006,
      longitude: 106.6527,
      maxServiceDistance: 10.0,
      isActive: true,
    },
    {
      name: "diLaudnryiin - Tebet",
      address: "Jl. Tebet Raya No. 45",
      districtId: 231,
      districtName: "Tebet",
      cityId: 153,
      cityName: "Jakarta Selatan",
      provinceId: 6,
      provinceName: "DKI Jakarta",
      postalCode: "12810",
      latitude: -6.2261,
      longitude: 106.8484,
      maxServiceDistance: 5.0,
      isActive: true,
    },
    {
      name: "NeatWash - Batuceper Express",
      address: "Jl. Daan Mogot Km. 21, Batuceper",
      districtId: 3671050, // Contoh ID District untuk Batuceper
      districtName: "Batuceper",
      cityId: 3671,
      cityName: "Tangerang Kota",
      provinceId: 36,
      provinceName: "Banten",
      postalCode: "15122",
      latitude: -6.1714, // Koordinat titik Batuceper
      longitude: 106.6741,
      maxServiceDistance: 20.0, // Radius 6 KM
      isActive: true,
    },
  ];

  for (const outlet of outlets) {
    await prisma.outlet.upsert({
      where: { id: "00000000-0000-0000-0000-000000000000" }, // Ini cuma placeholder
      update: {},
      create: outlet,
    });
  }
}
