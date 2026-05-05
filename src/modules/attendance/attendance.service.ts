import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { calcPagination } from "../../helpers/pagination.helper";
import {
  getTodayDate,
  determineStatus,
  buildDateFilter,
} from "./helpers/attendance.helper";

const INCLUDE_EMPLOYEE = {
  shift: true,
  employee: { select: { firstName: true, lastName: true, role: true } },
};

async function validateNoExistingCheckIn(employeeId: string, today: Date) {
  const existing = await prisma.attendance.findFirst({
    where: { employeeId, date: today, deletedAt: null },
  });
  if (existing) throw AppError("Anda sudah melakukan check-in hari ini", 400);
}

async function resolveShiftId(shiftId?: string): Promise<string> {
  if (shiftId) {
    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, deletedAt: null },
    });
    if (!shift) throw AppError("Shift tidak ditemukan", 404);
    return shiftId;
  }

  const defaultShift = await prisma.shift.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!defaultShift) throw AppError("Tidak ada shift tersedia. Hubungi admin.", 400);
  return defaultShift.id;
}

async function findTodayAttendance(employeeId: string) {
  return prisma.attendance.findFirst({
    where: { employeeId, date: getTodayDate(), deletedAt: null },
    include: { shift: true },
  });
}

export const attendanceService = {
  async checkIn(employeeId: string, shiftId?: string, notes?: string) {
    const today = getTodayDate();
    await validateNoExistingCheckIn(employeeId, today);
    const resolvedShiftId = await resolveShiftId(shiftId);
    const status = determineStatus();

    return prisma.attendance.create({
      data: { employeeId, shiftId: resolvedShiftId, checkIn: new Date(), date: today, status, notes: notes || null },
      include: INCLUDE_EMPLOYEE,
    });
  },

  async checkOut(employeeId: string) {
    const attendance = await findTodayAttendance(employeeId);
    if (!attendance) throw AppError("Anda belum melakukan check-in hari ini", 400);
    if (attendance.checkOut) throw AppError("Anda sudah melakukan check-out hari ini", 400);

    return prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: new Date() },
      include: INCLUDE_EMPLOYEE,
    });
  },

  async getStatus(employeeId: string) {
    const attendance = await findTodayAttendance(employeeId);
    return {
      isCheckedIn: !!attendance,
      isCheckedOut: !!attendance?.checkOut,
      attendance,
    };
  },

  async getHistory(
    employeeId: string, page: number, limit: number,
    month?: number, year?: number, sortBy = "date", sortOrder = "desc",
  ) {
    const skip = (page - 1) * limit;
    const where: any = { employeeId, deletedAt: null };
    const dateFilter = buildDateFilter(month, year);
    if (dateFilter) where.date = dateFilter;

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where, include: { shift: true },
        orderBy: { [sortBy]: sortOrder }, skip, take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return { attendances, pagination: calcPagination(page, limit, total) };
  },
};
