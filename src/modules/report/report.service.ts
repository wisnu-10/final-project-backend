import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";

type GroupBy = "day" | "month" | "year";

interface SalesReportFilters {
  groupBy: GroupBy;
  outletId?: string;
  startDate?: string;
  endDate?: string;
}

interface EmployeePerformanceFilters {
  outletId?: string;
  startDate?: string;
  endDate?: string;
  role?: "worker" | "driver";
}

export const reportService = {
  async getSalesReport(
    employeeRole: string,
    employeeOutletId: string | null,
    filters: SalesReportFilters,
  ) {
    const whereClause: any = {
      deletedAt: null,
      payments: {
        some: {
          status: "paid",
        },
      },
    };

    // Outlet Admin: auto-scope to own outlet
    if (employeeRole === "outlet_admin") {
      if (!employeeOutletId) {
        throw AppError("You are not assigned to any outlet", 403);
      }
      whereClause.outletId = employeeOutletId;
    }

    // Super Admin: optional outlet filter
    if (employeeRole === "super_admin" && filters.outletId) {
      whereClause.outletId = filters.outletId;
    }

    // Date range filter
    if (filters.startDate && filters.endDate) {
      whereClause.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate + "T23:59:59.999Z"),
      };
    } else if (filters.startDate) {
      whereClause.createdAt = {
        gte: new Date(filters.startDate),
      };
    } else if (filters.endDate) {
      whereClause.createdAt = {
        lte: new Date(filters.endDate + "T23:59:59.999Z"),
      };
    }

    // Fetch all paid orders with their payments
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        totalPrice: true,
        createdAt: true,
        outlet: { select: { id: true, name: true } },
        payments: {
          where: { status: "paid" },
          select: { amount: true, paidAt: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by period
    const grouped: Record<
      string,
      { totalIncome: number; totalOrders: number }
    > = {};

    for (const order of orders) {
      const date = new Date(order.createdAt);
      let periodKey: string;

      switch (filters.groupBy) {
        case "day":
          periodKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
          break;
        case "month":
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
          break;
        case "year":
          periodKey = `${date.getFullYear()}`; // YYYY
          break;
        default:
          periodKey = date.toISOString().split("T")[0];
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = { totalIncome: 0, totalOrders: 0 };
      }

      // Sum the paid payments for this order
      const paidAmount = order.payments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
      );

      grouped[periodKey].totalIncome += paidAmount;
      grouped[periodKey].totalOrders += 1;
    }

    // Convert to array
    const data = Object.entries(grouped)
      .map(([period, values]) => ({
        period,
        totalIncome: values.totalIncome,
        totalOrders: values.totalOrders,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Summary
    const summary = {
      totalIncome: data.reduce((sum, d) => sum + d.totalIncome, 0),
      totalOrders: data.reduce((sum, d) => sum + d.totalOrders, 0),
      averageOrderValue: 0,
    };
    if (summary.totalOrders > 0) {
      summary.averageOrderValue = summary.totalIncome / summary.totalOrders;
    }

    return { data, summary };
  },

  async getEmployeePerformance(
    employeeRole: string,
    employeeOutletId: string | null,
    filters: EmployeePerformanceFilters,
  ) {
    const employeeWhere: any = {
      deletedAt: null,
    };

    // Outlet Admin: auto-scope
    if (employeeRole === "outlet_admin") {
      if (!employeeOutletId) {
        throw AppError("You are not assigned to any outlet", 403);
      }
      employeeWhere.outletId = employeeOutletId;
    }

    // Super Admin: optional outlet filter
    if (employeeRole === "super_admin" && filters.outletId) {
      employeeWhere.outletId = filters.outletId;
    }

    // Role filter
    if (filters.role) {
      employeeWhere.role = filters.role;
    } else {
      employeeWhere.role = { in: ["worker", "driver"] };
    }

    // Date range for counting tasks
    const dateFilter: any = {};
    if (filters.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      dateFilter.lte = new Date(filters.endDate + "T23:59:59.999Z");
    }

    // Get all matching employees
    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        outlet: { select: { id: true, name: true } },
      },
      orderBy: { firstName: "asc" },
    });

    // For each employee, count their tasks
    const results = await Promise.all(
      employees.map(async (emp) => {
        let totalTasks = 0;

        if (emp.role === "worker") {
          // Workers: count OrderStatus entries where they are assigned and finished
          const statusWhere: any = {
            workerId: emp.id,
            finishedAt: { not: null },
            deletedAt: null,
          };
          if (Object.keys(dateFilter).length > 0) {
            statusWhere.createdAt = dateFilter;
          }

          totalTasks = await prisma.orderStatus.count({
            where: statusWhere,
          });
        } else if (emp.role === "driver") {
          // Drivers: count completed pickup + delivery tasks
          const orderWhere: any = {
            deletedAt: null,
          };
          if (Object.keys(dateFilter).length > 0) {
            orderWhere.createdAt = dateFilter;
          }

          const [pickupCount, deliveryCount] = await Promise.all([
            prisma.order.count({
              where: {
                ...orderWhere,
                driverPickupId: emp.id,
                completedPickupAt: { not: null },
              },
            }),
            prisma.order.count({
              where: {
                ...orderWhere,
                driverDeliveryId: emp.id,
                completedDeliveryAt: { not: null },
              },
            }),
          ]);

          totalTasks = pickupCount + deliveryCount;
        }

        return {
          employeeId: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          role: emp.role,
          outletName: emp.outlet?.name || null,
          totalTasks,
        };
      }),
    );

    // Sort by most tasks first
    results.sort((a, b) => b.totalTasks - a.totalTasks);

    return { data: results };
  },
};
