import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { geocodeAddress } from "../../helpers/opencage.helper";
import { CreateOutletDTO, UpdateOutletDTO, GetOutletsQuery } from "../../types/outlet.dto";

// Membentuk string alamat lengkap untuk dikirim ke OpenCage
const buildFullAddress = (
  address: string,
  districtName: string,
  cityName: string,
  provinceName: string,
): string => {
  return `${address}, ${districtName}, ${cityName}, ${provinceName}, Indonesia`;
};

export const outletService = {
  async createOutlet(data: CreateOutletDTO) {
    // 1. Cek apakah ada outlet aktif dengan nama yang sama
    const activeOutlet = await prisma.outlet.findFirst({
      where: { name: data.name, deletedAt: null },
    });

    if (activeOutlet) {
      throw AppError("Outlet with this name already exists", 409);
    }

    // 2. Cek apakah ada outlet yang sudah dihapus dengan nama yang sama
    const deletedOutlet = await prisma.outlet.findFirst({
      where: { name: data.name, NOT: { deletedAt: null } },
    });

    // Geocode alamat untuk mendapatkan koordinat presisi via OpenCage HANYA JIKA latitude/longitude tidak dikirim manual
    let latitude = data.latitude;
    let longitude = data.longitude;

    if (latitude === undefined || longitude === undefined) {
      const fullAddress = buildFullAddress(
        data.address,
        data.districtName,
        data.cityName,
        data.provinceName,
      );

      const coords = await geocodeAddress(fullAddress);
      latitude = coords.latitude;
      longitude = coords.longitude;
    }

    if (deletedOutlet) {
      // Restore the soft-deleted outlet with new data
      return await prisma.outlet.update({
        where: { id: deletedOutlet.id },
        data: {
          ...data,
          latitude,
          longitude,
          deletedAt: null,
        },
      });
    }

    const outlet = await prisma.outlet.create({
      data: {
        ...data,
        latitude,
        longitude,
      },
    });

    return outlet;
  },

  async getOutlets(query: GetOutletsQuery) {
    const { search, isActive, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { cityName: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { districtName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [outlets, total] = await Promise.all([
      prisma.outlet.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.outlet.count({ where }),
    ]);

    return {
      outlets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getOutletById(id: string) {
    const outlet = await prisma.outlet.findUnique({
      where: { id, deletedAt: null },
      include: {
        employees: {
          where: { deletedAt: null },
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    if (!outlet) throw AppError("Outlet not found", 404);

    return outlet;
  },

  async updateOutlet(id: string, data: UpdateOutletDTO) {
    const outlet = await prisma.outlet.findUnique({
      where: { id, deletedAt: null },
    });

    if (!outlet) throw AppError("Outlet not found", 404);

    if (data.name && data.name !== outlet.name) {
      const duplicate = await prisma.outlet.findFirst({
        where: { name: data.name, deletedAt: null, NOT: { id } },
      });
      if (duplicate) throw AppError("Outlet with this name already exists", 409);
    }

    const updatePayload: any = { ...data };

    // Jika latitude/longitude dikirim dari frontend, gunakan itu.
    // Jika tidak dikirim TAPI alamat/wilayah berubah, baru re-geocode.
    const hasManualCoords = data.latitude !== undefined && data.longitude !== undefined;
    
    if (!hasManualCoords) {
      const addressChanged =
        data.address || data.districtName || data.cityName || data.provinceName;

      if (addressChanged) {
        const fullAddress = buildFullAddress(
          data.address ?? outlet.address,
          data.districtName ?? outlet.districtName,
          data.cityName ?? outlet.cityName,
          data.provinceName ?? outlet.provinceName,
        );

        const { latitude, longitude } = await geocodeAddress(fullAddress);
        updatePayload.latitude = latitude;
        updatePayload.longitude = longitude;
      }
    }

    const updatedOutlet = await prisma.outlet.update({
      where: { id },
      data: updatePayload,
    });

    return updatedOutlet;
  },

  async deleteOutlet(id: string) {
    const outlet = await prisma.outlet.findUnique({
      where: { id, deletedAt: null },
    });

    if (!outlet) throw AppError("Outlet not found", 404);

    const activeEmployees = await prisma.employee.count({
      where: { outletId: id, deletedAt: null },
    });

    if (activeEmployees > 0) {
      throw AppError(
        `Cannot delete outlet: ${activeEmployees} active employee(s) still assigned to this outlet`,
        400,
      );
    }

    await prisma.outlet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: "Outlet deleted successfully" };
  },
};
