import { prisma } from "../../config/prisma-client.config";
import AppError from "../../helpers/app-error.helper";
import { CreateComplaintDTO } from "../../types/complaint.dto";

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

  async getComplaints(employeeId: string) {
    const existingEmployee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
    });

    if (!existingEmployee) throw AppError("Account admin not found", 404);

    return await prisma.complaint.findMany({
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
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getComplainById(employeeId: string, id: string) {
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
};
