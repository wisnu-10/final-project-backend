import { Request, Response } from "express";
import { CreateOrderPickupDTO } from "../../types/orderCustomer.dto";
import { orderCustomerService } from "./order-customer.service";
import {
  OrderStatusEnum,
  PaymentStatus,
} from "../../../generated/prisma/enums";

export const orderCustomerController = {
  async createOrderPickup(req: Request, res: Response) {
    const { customerId } = res.locals.payload;

    const createOrderPickup = req.body as CreateOrderPickupDTO;

    await orderCustomerService.createOrderPickup(customerId, createOrderPickup);

    res.status(201).json({
      success: true,
      message: "Create order pickup success",
      data: createOrderPickup,
    });
  },

  async getAllOrder(req: Request, res: Response) {
    const { customerId } = res.locals.payload;

    const { search, paymentStatus, orderStatus, startDate, endDate } =
      req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await orderCustomerService.getAllOrder(customerId, {
      page,
      limit,
      search: search as string,
      paymentStatus: paymentStatus as PaymentStatus,
      orderStatus: orderStatus as OrderStatusEnum,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json({
      success: true,
      message: "Get all order success",
      data: {
        orders: result,
      },
    });
  },

  async getById(req: Request, res: Response) {
    const { customerId } = res.locals.payload;

    const { id } = req.params;

    const result = await orderCustomerService.getById(customerId, id as string);

    res.status(200).json({
      success: true,
      message: `Get by id ${id} succes`,
      data: result,
    });
  },
};
