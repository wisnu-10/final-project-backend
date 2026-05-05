import { Request, Response } from "express";
import { orderWorkerService } from "./order-worker.service";

export const orderWorkerController = {
  async getAvailableTasks(req: Request, res: Response) {
    const { outletId } = res.locals.payload;
    const result = await orderWorkerService.getAvailableTasks(outletId);
    res.status(200).json({ success: true, data: result });
  },

  async getMyTasks(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const result = await orderWorkerService.getMyTasks(employeeId);
    res.status(200).json({ success: true, data: result });
  },

  async acceptTask(req: Request, res: Response) {
    const { employeeId, outletId } = res.locals.payload;
    const { orderId } = req.body;
    const result = await orderWorkerService.acceptTask(employeeId, orderId, outletId);
    res.status(200).json({ success: true, message: "Task accepted", data: result });
  },

  async completeTask(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const { orderId } = req.body;
    const result = await orderWorkerService.completeTask(employeeId, orderId);
    res.status(200).json({ success: true, message: "Station completed", data: result });
  },

  async getOrderDetail(req: Request, res: Response) {
    const { outletId } = res.locals.payload;
    const { id } = req.params;
    const result = await orderWorkerService.getOrderDetail(id as string, outletId as string);
    res.status(200).json({ success: true, data: result });
  },

  async getWorkerHistory(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const result = await orderWorkerService.getWorkerHistory(employeeId);
    res.status(200).json({ success: true, data: result });
  },
};
