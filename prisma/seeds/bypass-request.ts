import { PrismaClient } from "../../generated/prisma/client";

export async function seedBypassRequests(prisma: PrismaClient) {
  console.log("🌱 Seeding Bypass Requests...");

  // Fetch some existing data to link the bypass requests correctly
  const order = await prisma.order.findFirst({
    where: { deletedAt: null },
    select: { id: true, outletId: true }
  });

  const worker = await prisma.employee.findFirst({
    where: { role: "worker" },
    select: { id: true }
  });

  const admin = await prisma.employee.findFirst({
    where: { role: "outlet_admin" },
    select: { id: true }
  });

  if (!order || !worker || !admin) {
    console.warn("⚠️ Skipping Bypass Request seeding: Required Order, Worker, or Admin not found.");
    return;
  }

  const bypassRequests = [
    {
      orderId: order.id,
      requestedBy: worker.id,
      notes: "Jumlah baju kurang 2 dari yang tertulis di nota (10 -> 8). Sudah dicari di keranjang lain tidak ada.",
      status: "waiting",
      station: "washing",
      expectedQuantity: 10,
      actualQuantity: 8,
    },
    {
      orderId: order.id,
      requestedBy: worker.id,
      approvedBy: admin.id,
      approvedAt: new Date(),
      notes: "Sprei robek sedikit di pojok kiri bawah. Customer sudah dikonfirmasi via WA dan setuju lanjut proses.",
      status: "approved",
      station: "ironing",
      expectedQuantity: 5,
      actualQuantity: 4, // Misal sprei dihitung per unit, tapi ada masalah kuantitas logic lain
    },
    {
      orderId: order.id,
      requestedBy: worker.id,
      approvedBy: admin.id,
      approvedAt: new Date(),
      notes: "Kaos kaki hilang 1 pasang. Admin menolak karena worker harus cari sampai ketemu atau ganti rugi.",
      status: "rejected",
      station: "packing",
      expectedQuantity: 12,
      actualQuantity: 11,
    }
  ];

  for (const request of bypassRequests) {
    // Check if duplicate exists for the order and station
    const existing = await prisma.bypassRequest.findFirst({
      where: {
        orderId: request.orderId,
        station: request.station as any,
        notes: request.notes,
      }
    });

    if (!existing) {
      await prisma.bypassRequest.create({
        data: request as any,
      });
    }
  }

  console.log("✅ Bypass Requests seeded successfully!");
}
