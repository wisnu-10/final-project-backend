import { Request, Response } from "express";
import { bypassRequestService, CreateBypassRequestDTO } from "./bypass-request.service";

export const bypassRequestController = {
  async createBypassRequest(req: Request, res: Response) {
    const { employeeId, outletId } = res.locals.payload;
    const { orderId } = req.params;
    const data = req.body as CreateBypassRequestDTO;

    const result = await bypassRequestService.createBypassRequest(
      employeeId as string,
      outletId as string,
      orderId as string,
      data,
    );

    res.status(201).json({
      success: true,
      message: "Bypass request created successfully. Waiting for admin approval.",
      data: result,
    });
  },

  async getBypassRequestsByOrder(req: Request, res: Response) {
    const { outletId } = res.locals.payload;
    const { orderId } = req.params;

    const result = await bypassRequestService.getBypassRequestsByOrder(
      outletId as string,
      orderId as string,
    );

    res.status(200).json({
      success: true,
      message: "Bypass requests fetched successfully",
      data: result,
    });
  },

  async getPendingBypassRequests(req: Request, res: Response) {
    const { outletId } = res.locals.payload;
    const { page, limit } = req.query;

    const result = await bypassRequestService.getPendingBypassRequests({
      outletId: outletId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      message: "Pending bypass requests fetched successfully",
      data: result,
    });
  },

  async approveBypassRequest(req: Request, res: Response) {
    const { employeeId, outletId } = res.locals.payload;
    const { id } = req.params;

    const result = await bypassRequestService.approveBypassRequest(
      employeeId as string,
      outletId as string,
      id as string,
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  },

  async rejectBypassRequest(req: Request, res: Response) {
    const { employeeId, outletId } = res.locals.payload;
    const { id } = req.params;

    const result = await bypassRequestService.rejectBypassRequest(
      employeeId as string,
      outletId as string,
      id as string,
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  },
};
