import { Request, Response } from "express";
import { orderDriverService } from "./order-driver.service";

export const orderDriverController = {
  async getAvailableTasks(req: Request, res: Response) {
    const { outletId } = res.locals.payload;
    const result = await orderDriverService.getAvailableTasks(outletId);
    res.status(200).json({ success: true, data: result });
  },

  async getMyTasks(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const result = await orderDriverService.getMyTasks(employeeId);
    res.status(200).json({ success: true, data: result });
  },

  async acceptPickup(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const { orderId } = req.body;
    const result = await orderDriverService.acceptPickup(employeeId, orderId);
    res.status(200).json({ success: true, message: "Pickup accepted", data: result });
  },

  async completePickup(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const { orderId } = req.body;
    const result = await orderDriverService.completePickup(employeeId, orderId);
    res.status(200).json({ success: true, message: "Pickup completed", data: result });
  },

  async acceptDelivery(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const { orderId } = req.body;
    const result = await orderDriverService.acceptDelivery(employeeId, orderId);
    res.status(200).json({ success: true, message: "Delivery accepted", data: result });
  },

  async completeDelivery(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const { orderId } = req.body;
    const result = await orderDriverService.completeDelivery(employeeId, orderId);
    res.status(200).json({ success: true, message: "Delivery completed", data: result });
  },

  async getDriverHistory(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const result = await orderDriverService.getDriverHistory(employeeId);
    res.status(200).json({ success: true, data: result });
  },
};
