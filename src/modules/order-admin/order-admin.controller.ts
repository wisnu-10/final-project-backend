import { Request, Response } from "express";
import { orderAdminService } from "./order-admin.service";
import {
  ProcessOrderDTO,
  UpdateOrderStatusDTO,
  CreateManualOrderDTO,
} from "../../types/order-admin.dto";
import { OrderStatusEnum } from "../../../generated/prisma/enums";

export const orderAdminController = {
  async getAllOrders(req: Request, res: Response) {
    const { role, outletId } = res.locals.payload;
    const {
      search,
      outletId: filterOutletId,
      orderStatus,
      workerId,
      startDate,
      endDate,
    } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await orderAdminService.getAllOrders(role, outletId, {
      page,
      limit,
      search: search as string,
      outletId: filterOutletId as string,
      orderStatus: orderStatus as OrderStatusEnum,
      workerId: workerId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: result,
    });
  },

  async getOrderById(req: Request, res: Response) {
    const { role, outletId } = res.locals.payload;
    const { id } = req.params;

    const result = await orderAdminService.getOrderById(
      role,
      outletId as string,
      id as string,
    );

    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: result,
    });
  },

  async processOrder(req: Request, res: Response) {
    const { employeeId, outletId } = res.locals.payload;
    const { id } = req.params;
    const data = req.body as ProcessOrderDTO;

    const result = await orderAdminService.processOrder(
      employeeId as string,
      outletId as string,
      id as string,
      data,
    );

    res.status(200).json({
      success: true,
      message: "Order processed successfully",
      data: result,
    });
  },

  async createManualOrder(req: Request, res: Response) {
    const { employeeId, outletId } = res.locals.payload;
    const data = req.body as CreateManualOrderDTO;

    const result = await orderAdminService.createManualOrder(
      employeeId as string,
      outletId as string,
      data,
    );

    res.status(201).json({
      success: true,
      message: "Manual order created successfully",
      data: result,
    });
  },

  async updateOrderStatus(req: Request, res: Response) {
    const { employeeId, outletId } = res.locals.payload;
    const { id } = req.params;
    const data = req.body as UpdateOrderStatusDTO;

    const result = await orderAdminService.updateOrderStatus(
      employeeId as string,
      outletId as string,
      id as string,
      data,
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  },

  async getOutletWorkers(req: Request, res: Response) {
    const { outletId } = res.locals.payload;

    if (!outletId) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to any outlet",
        data: null,
      });
    }

    const result = await orderAdminService.getOutletWorkers(outletId as string);

    res.status(200).json({
      success: true,
      message: "Workers fetched successfully",
      data: result,
    });
  },

  async getCustomers(req: Request, res: Response) {
    const { search } = req.query;

    const result = await orderAdminService.getCustomers(search as string);

    res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: result,
    });
  },
};
