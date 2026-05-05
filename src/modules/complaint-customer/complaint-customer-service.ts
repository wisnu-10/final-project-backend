import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { CreateComplaintDTO, GetComplaintsDTO, ResolveComplaintDTO } from "../../types/complaint.dto";
import { ComplaintStatus } from "../../../generated/prisma/client";

export const complaintCustomerService = {
  async createComplaint(customerId: string, complaint: CreateComplaintDTO) {
    const order = await prisma.order.findFirst({
      where: {
        id: complaint.orderId,
        customerId: customerId,
      },
      include: {
        statusLogs: {
          where: {
            status: {
              in: ["delivering", "completed"],
            },
          },
        },
      },
    });

    if (!order) throw AppError("Order is not existing", 404);

    const statusComplaint = await prisma.complaint.findFirst({
      where: {
        orderId: complaint.orderId,
        customerId: customerId,
        status: {
          in: ["resolved", "rejected"],
        },
      },
    });

    if (statusComplaint)
      throw AppError(
        "You have already submitted a complaint for this order",
        400,
      );

    await prisma.complaint.create({
      data: {
        orderId: complaint.orderId,
        customerId: customerId,
        description: complaint.description,
        status: "pending",
      },
    });
  },

  async getComplaints(employeeId: string, filters: GetComplaintsDTO) {
    const existingEmployee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
    });

    if (!existingEmployee) throw AppError("Account admin not found", 404);

    const skip = (filters.page - 1) * filters.limit;

    const whereClause: any = {
      deletedAt: null,
    };

    // Outlet Admin: only see complaints of their own outlet
    if (existingEmployee.role === "outlet_admin") {
      if (!existingEmployee.outletId) {
        throw AppError("You are not assigned to any outlet", 403);
      }
      whereClause.order = { outletId: existingEmployee.outletId };
    }

    // Super Admin: can filter by specific outlet
    if (existingEmployee.role === "super_admin" && filters.outletId) {
      whereClause.order = { outletId: filters.outletId };
    }

    // Filter by status
    if (filters.status) {
      whereClause.status = filters.status;
    }

    // Search by customer name or email
    if (filters.search) {
      whereClause.OR = [
        {
          customer: {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [complaints, totalComplaints] = await Promise.all([
      prisma.complaint.findMany({
        where: whereClause,
        skip,
        take: filters.limit,
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          order: {
            select: { 
              id: true, 
              invoiceNumber: true,
              outletId: true,
              outlet: {
                select: { name: true }
              }
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.complaint.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalComplaints / filters.limit);

    return {
      complaints,
      pagination: {
        total: totalComplaints,
        page: filters.page,
        limit: filters.limit,
        totalPages,
      },
    };
  },

  async getComplaintById(employeeId: string, id: string) {
    const existingEmployee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
    });

    if (!existingEmployee) throw AppError("Account admin not found", 404);

    const existingComplaint = await prisma.complaint.findUnique({
      where: {
        id: id,
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        order: {
          include: { outlet: true, pickupAddress: true, deliveryAddress: true },
        },
      },
    });

    if (!existingComplaint) throw AppError("Complaint not found", 404);

    return existingComplaint;
  },

  async resolveComplaint(employeeId: string, complaintId: string, data: ResolveComplaintDTO) {
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!existingEmployee) throw AppError("Employee not found", 404);

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { order: true }
    });

    if (!complaint) throw AppError("Complaint not found", 404);

    // If outlet_admin, restrict to their outlet
    if (existingEmployee.role === "outlet_admin") {
      if (complaint.order.outletId !== existingEmployee.outletId) {
        throw AppError("You don't have permission to handle complaints for this outlet", 403);
      }
    }

    if (complaint.status !== "pending") {
      throw AppError("Complaint has already been handled", 400);
    }

    return await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: data.status as ComplaintStatus,
        adminResponse: data.adminResponse,
        resolvedById: employeeId,
      },
    });
  },
};
