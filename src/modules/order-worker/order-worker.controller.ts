import { Request, Response } from "express";
import { orderWorkerService } from "./order-worker.service";

export const orderWorkerController = {
  async getWorkerOrders(req: Request, res: Response) {
    const { employeeId, outletId } = res.locals.payload;

    const result = await orderWorkerService.getWorkerOrders(
      employeeId as string,
      outletId as string,
    );

    res.status(200).json({
      success: true,
      message: "Worker orders fetched successfully",
      data: result,
    });
  },

  async getWorkerOrderDetail(req: Request, res: Response) {
    const { employeeId, outletId } = res.locals.payload;
    const { id } = req.params;

    const result = await orderWorkerService.getWorkerOrderDetail(
      employeeId as string,
      outletId as string,
      id as string,
    );

    res.status(200).json({
      success: true,
      message: "Worker order detail fetched successfully",
      data: result,
    });
  },
};
