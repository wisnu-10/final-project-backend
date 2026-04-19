import { Request, Response } from "express";
import { orderWorkerService } from "./order-worker.service";

export const orderWorkerController = {
  async getWorkerOrders(req: Request, res: Response) {
    const { employeeId, outletId } = res.locals.payload;
    const result = await orderWorkerService.getWorkerOrders(employeeId, outletId);
    res.status(200).json({ success: true, data: result });
  },

  async getAvailableTasks(req: Request, res: Response) {
    const { outletId } = res.locals.payload;
    const result = await orderWorkerService.getAvailableTasks(outletId);
    res.status(200).json({ success: true, data: result });
  },

  async acceptTask(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const { orderId } = req.body;
    const result = await orderWorkerService.acceptTask(employeeId, orderId);
    res.status(200).json({ success: true, message: "Task accepted", data: result });
  },

  async completeTask(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const { orderId } = req.body;
    const result = await orderWorkerService.completeTask(employeeId, orderId);
    res.status(200).json({ success: true, message: "Station completed", data: result });
  },

  async getWorkHistory(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const result = await orderWorkerService.getWorkHistory(employeeId);
    res.status(200).json({ success: true, data: result });
  },

  async getWorkerOrderDetail(req: Request, res: Response) {
    const { employeeId, outletId } = res.locals.payload;
    const { id } = req.params;
    const result = await orderWorkerService.getWorkerOrderDetail(employeeId, outletId, id as string);
    res.status(200).json({ success: true, data: result });
  },
};
