import { Request, Response } from "express";
import { reportService } from "./report.service";

export const reportController = {
  async getSalesReport(req: Request, res: Response) {
    const { role, outletId } = res.locals.payload;
    const {
      groupBy = "month",
      outletId: filterOutletId,
      startDate,
      endDate,
    } = req.query;

    const result = await reportService.getSalesReport(role, outletId, {
      groupBy: groupBy as "day" | "month" | "year",
      outletId: filterOutletId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json({
      success: true,
      message: "Sales report fetched successfully",
      data: result,
    });
  },

  async getEmployeePerformance(req: Request, res: Response) {
    const { role, outletId } = res.locals.payload;
    const {
      outletId: filterOutletId,
      startDate,
      endDate,
      role: filterRole,
    } = req.query;

    const result = await reportService.getEmployeePerformance(
      role,
      outletId,
      {
        outletId: filterOutletId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        role: filterRole as "worker" | "driver" | undefined,
      },
    );

    res.status(200).json({
      success: true,
      message: "Employee performance report fetched successfully",
      data: result,
    });
  },
};
