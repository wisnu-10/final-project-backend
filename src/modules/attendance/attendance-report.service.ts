import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { calcPagination } from "../../helpers/pagination.helper";
import { getTodayDate, buildDateRangeFilter } from "./helpers/attendance.helper";

function buildEmployeeWhere(outletId: string, search?: string) {
  const where: any = { outletId, deletedAt: null, role: { in: ["driver", "worker"] } };
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }
  return where;
}

function buildAttendanceWhere(
  startDate?: string, endDate?: string, status?: string,
  employeeId?: string,
) {
  const where: any = { deletedAt: null };
  const dateFilter = buildDateRangeFilter(startDate, endDate);
  if (dateFilter) where.date = dateFilter;
  if (status) where.status = status;
  if (employeeId) where.employeeId = employeeId;
  return where;
}

function countStats(attendances: any[], totalEmployees: number) {
  return {
    totalEmployees,
    presentToday: attendances.filter((a: any) => a.status === "present").length,
    lateToday: attendances.filter((a: any) => a.status === "late").length,
    absentToday: totalEmployees - attendances.length,
  };
}

async function fetchTodaySummary(outletId: string) {
  const empWhere: any = { outletId, deletedAt: null, role: { in: ["driver", "worker"] } };

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where: { employee: empWhere, date: getTodayDate(), deletedAt: null },
    }),
    prisma.employee.count({ where: empWhere }),
  ]);

  return countStats(attendances, total);
}

async function fetchEmployeeStats(employeeId: string) {
  const all = await prisma.attendance.findMany({
    where: { employeeId, deletedAt: null },
  });
  return {
    totalPresent: all.filter((a) => a.status === "present").length,
    totalLate: all.filter((a) => a.status === "late").length,
    totalAbsent: all.filter((a) => a.status === "absent").length,
    totalDays: all.length,
  };
}

export const attendanceReportService = {
  async getReport(
    outletId: string, page: number, limit: number,
    startDate?: string, endDate?: string, status?: string,
    search?: string, sortBy = "firstName", sortOrder = "asc",
  ) {
    const skip = (page - 1) * limit;
    const employeeWhere = buildEmployeeWhere(outletId, search);
    const attWhere = buildAttendanceWhere(startDate, endDate, status);

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: employeeWhere,
        select: {
          id: true, firstName: true, lastName: true, role: true,
          attendances: { where: attWhere, include: { shift: true }, orderBy: { date: "desc" } },
        },
        skip, take: limit, orderBy: { [sortBy]: sortOrder },
      }),
      prisma.employee.count({ where: employeeWhere }),
    ]);

    const summary = await fetchTodaySummary(outletId);
    return { employees, summary, pagination: calcPagination(page, limit, total) };
  },

  async getEmployeeReport(
    outletId: string, employeeId: string,
    page: number, limit: number,
    startDate?: string, endDate?: string, status?: string,
    sortBy = "date", sortOrder = "desc",
  ) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, outletId, deletedAt: null },
    });
    if (!employee) throw AppError("Karyawan tidak ditemukan di outlet Anda", 404);

    const skip = (page - 1) * limit;
    const where = buildAttendanceWhere(startDate, endDate, status, employeeId);

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where, include: { shift: true },
        orderBy: { [sortBy]: sortOrder }, skip, take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    const stats = await fetchEmployeeStats(employeeId);
    return {
      employee: { id: employee.id, firstName: employee.firstName, lastName: employee.lastName, role: employee.role },
      attendances, stats, pagination: calcPagination(page, limit, total),
    };
  },
};
