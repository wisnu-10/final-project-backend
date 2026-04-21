import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { calcPagination } from "../../helpers/pagination.helper";

// ─── Attendance Helpers ──────────────────────────────────
const LATE_HOUR = 8;

function getTodayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function determineStatus(): "present" | "late" {
  return new Date().getHours() < LATE_HOUR ? "present" : "late";
}

function buildDateFilter(month?: number, year?: number) {
  if (month && year) {
    return { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) };
  }
  if (year) {
    return { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) };
  }
  return undefined;
}

function buildDateRangeFilter(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return undefined;
  const filter: any = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return filter;
}

const INCLUDE_EMPLOYEE = {
  shift: true,
  employee: { select: { firstName: true, lastName: true, role: true } },
};

export const orderWorkerService = {
  /**
   * Get orders assigned to a specific worker (limited view)
   * Only returns: orderId, customer name, current station, bypass status
   */
  async getWorkerOrders(workerId: string, workerOutletId: string | null) {
    if (!workerOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    // Find orders where this worker is assigned in any status log
    const orders = await prisma.order.findMany({
      where: {
        outletId: workerOutletId,
        deletedAt: null,
        statusLogs: {
          some: {
            workerId,
          },
        },
      },
      select: {
        id: true,
        customer: {
          select: { firstName: true, lastName: true },
        },
        statusLogs: {
          select: {
            status: true,
            workerId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        bypassRequests: {
          where: {
            deletedAt: null,
            status: "waiting",
          },
          select: {
            id: true,
            status: true,
            station: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to simplified format
    return orders.map((order) => ({
      orderId: order.id,
      customerName: `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim(),
      currentStation: order.statusLogs[0]?.status || "unknown",
      hasPendingBypass: order.bypassRequests.length > 0,
      createdAt: order.createdAt,
    }));
  },

  /**
   * Get limited order detail for worker:
   * - Customer name, Order ID
   * - Laundry items with expected quantities
   * - Bypass request status
   */
  async getWorkerOrderDetail(
    workerId: string,
    workerOutletId: string | null,
    orderId: string,
  ) {
    if (!workerOutletId) {
      throw AppError("You are not assigned to any outlet", 403);
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        outletId: workerOutletId,
        deletedAt: null,
        statusLogs: {
          some: {
            workerId,
          },
        },
      },
      select: {
        id: true,
        customer: {
          select: { firstName: true, lastName: true },
        },
        orderItems: {
          where: { deletedAt: null },
          select: {
            id: true,
            quantity: true,
            laundryItem: {
              select: { id: true, name: true, pricingType: true },
            },
          },
        },
        statusLogs: {
          select: {
            id: true,
            status: true,
            workerId: true,
            totalItem: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        bypassRequests: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            station: true,
            notes: true,
            expectedQuantity: true,
            actualQuantity: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) throw AppError("Order not found or not assigned to you", 404);

    const latestStatus = order.statusLogs[0]?.status || "unknown";

    // Calculate total expected items
    const totalExpectedItems = order.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      orderId: order.id,
      customerName: `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim(),
      currentStation: latestStatus,
      orderItems: order.orderItems,
      totalExpectedItems,
      bypassRequests: order.bypassRequests,
    };
  },

  // ─── Submit Attendance: Check-In ──────────────────────────
  async submitCheckIn(employeeId: string, shiftId?: string, notes?: string) {
    const today = getTodayDate();

    const existing = await prisma.attendance.findFirst({
      where: { employeeId, date: today, deletedAt: null },
    });
    if (existing) throw AppError("Anda sudah melakukan check-in hari ini", 400);

    const resolvedShiftId = await resolveShiftId(shiftId);
    const status = determineStatus();

    return prisma.attendance.create({
      data: {
        employeeId,
        shiftId: resolvedShiftId,
        checkIn: new Date(),
        date: today,
        status,
        notes: notes || null,
      },
      include: INCLUDE_EMPLOYEE,
    });
  },

  // ─── Submit Attendance: Check-Out ─────────────────────────
  async submitCheckOut(employeeId: string) {
    const attendance = await prisma.attendance.findFirst({
      where: { employeeId, date: getTodayDate(), deletedAt: null },
      include: { shift: true },
    });
    if (!attendance) throw AppError("Anda belum melakukan check-in hari ini", 400);
    if (attendance.checkOut) throw AppError("Anda sudah melakukan check-out hari ini", 400);

    return prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: new Date() },
      include: INCLUDE_EMPLOYEE,
    });
  },

  // ─── Attendance Status (today) ────────────────────────────
  async getAttendanceStatus(employeeId: string) {
    const attendance = await prisma.attendance.findFirst({
      where: { employeeId, date: getTodayDate(), deletedAt: null },
      include: { shift: true },
    });
    return {
      isCheckedIn: !!attendance,
      isCheckedOut: !!attendance?.checkOut,
      attendance,
    };
  },

  // ─── Attendance Log (own history) ─────────────────────────
  async getAttendanceLog(
    employeeId: string,
    page: number,
    limit: number,
    month?: number,
    year?: number,
    sortBy = "date",
    sortOrder = "desc",
  ) {
    const skip = (page - 1) * limit;
    const where: any = { employeeId, deletedAt: null };
    const dateFilter = buildDateFilter(month, year);
    if (dateFilter) where.date = dateFilter;

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { shift: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return { attendances, pagination: calcPagination(page, limit, total) };
  },

  // ─── Attendance Report (admin outlet) ─────────────────────
  async getAttendanceReport(
    outletId: string,
    page: number,
    limit: number,
    startDate?: string,
    endDate?: string,
    status?: string,
    search?: string,
    sortBy = "firstName",
    sortOrder = "asc",
  ) {
    const skip = (page - 1) * limit;

    const employeeWhere: any = {
      outletId,
      deletedAt: null,
      role: { in: ["driver", "worker"] },
    };
    if (search) {
      employeeWhere.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const attWhere: any = { deletedAt: null };
    const dateFilter = buildDateRangeFilter(startDate, endDate);
    if (dateFilter) attWhere.date = dateFilter;
    if (status) attWhere.status = status;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: employeeWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          attendances: {
            where: attWhere,
            include: { shift: true },
            orderBy: { date: "desc" },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.employee.count({ where: employeeWhere }),
    ]);

    // Today's summary stats
    const empCountWhere: any = {
      outletId,
      deletedAt: null,
      role: { in: ["driver", "worker"] },
    };
    const [todayAttendances, totalEmployees] = await Promise.all([
      prisma.attendance.findMany({
        where: { employee: empCountWhere, date: getTodayDate(), deletedAt: null },
      }),
      prisma.employee.count({ where: empCountWhere }),
    ]);

    const summary = {
      totalEmployees,
      presentToday: todayAttendances.filter((a: any) => a.status === "present").length,
      lateToday: todayAttendances.filter((a: any) => a.status === "late").length,
      absentToday: totalEmployees - todayAttendances.length,
    };

    return { employees, summary, pagination: calcPagination(page, limit, total) };
  },

  // ─── Attendance Report per Employee (admin outlet) ────────
  async getEmployeeAttendanceReport(
    outletId: string,
    employeeId: string,
    page: number,
    limit: number,
    startDate?: string,
    endDate?: string,
    status?: string,
    sortBy = "date",
    sortOrder = "desc",
  ) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, outletId, deletedAt: null },
    });
    if (!employee) throw AppError("Karyawan tidak ditemukan di outlet Anda", 404);

    const skip = (page - 1) * limit;
    const where: any = { employeeId, deletedAt: null };
    const dateFilter = buildDateRangeFilter(startDate, endDate);
    if (dateFilter) where.date = dateFilter;
    if (status) where.status = status;

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { shift: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    // Stats for this employee
    const allRecords = await prisma.attendance.findMany({
      where: { employeeId, deletedAt: null },
    });
    const stats = {
      totalPresent: allRecords.filter((a) => a.status === "present").length,
      totalLate: allRecords.filter((a) => a.status === "late").length,
      totalAbsent: allRecords.filter((a) => a.status === "absent").length,
      totalDays: allRecords.length,
    };

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
      },
      attendances,
      stats,
      pagination: calcPagination(page, limit, total),
    };
  },
};

// ─── Private Helper ──────────────────────────────────────
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