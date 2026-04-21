import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { calcPagination } from "../../helpers/pagination.helper";

function parseTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date("1970-01-01T00:00:00Z");
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

export const shiftService = {
  async create(shiftName: string, startTime: string, endTime: string) {
    const existing = await prisma.shift.findFirst({
      where: { shiftName, deletedAt: null },
    });
    if (existing) throw AppError("Shift with this name already exists", 409);

    return prisma.shift.create({
      data: {
        shiftName,
        startTime: parseTimeToDate(startTime),
        endTime: parseTimeToDate(endTime),
      },
    });
  },

  async findAll(
    page: number, limit: number,
    search?: string, sortBy = "startTime", sortOrder = "asc",
  ) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (search) where.shiftName = { contains: search, mode: "insensitive" };

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where, orderBy: { [sortBy]: sortOrder }, skip, take: limit,
      }),
      prisma.shift.count({ where }),
    ]);

    return { shifts, pagination: calcPagination(page, limit, total) };
  },

  async findById(id: string) {
    const shift = await prisma.shift.findFirst({
      where: { id, deletedAt: null },
    });
    if (!shift) throw AppError("Shift not found", 404);
    return shift;
  },

  async update(
    id: string, shiftName?: string,
    startTime?: string, endTime?: string,
  ) {
    await this.findById(id);
    const data: any = {};
    if (shiftName) data.shiftName = shiftName;
    if (startTime) data.startTime = parseTimeToDate(startTime);
    if (endTime) data.endTime = parseTimeToDate(endTime);

    return prisma.shift.update({ where: { id }, data });
  },

  async delete(id: string) {
    await this.findById(id);
    await prisma.shift.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
