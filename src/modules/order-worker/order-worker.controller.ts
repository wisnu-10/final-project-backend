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

  // ─── Submit Attendance ────────────────────────────────────
  async submitCheckIn(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const { shiftId, notes } = req.body;
    const attendance = await orderWorkerService.submitCheckIn(employeeId, shiftId, notes);

    const message = attendance.status === "present"
      ? "Check-in berhasil! Anda tepat waktu ✅"
      : "Check-in berhasil, namun Anda terlambat ⚠️";

    res.status(201).json({ success: true, message, data: attendance });
  },

  async submitCheckOut(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const attendance = await orderWorkerService.submitCheckOut(employeeId);
    res.status(200).json({ success: true, message: "Check-out berhasil! 👋", data: attendance });
  },

  async getAttendanceStatus(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const status = await orderWorkerService.getAttendanceStatus(employeeId);
    res.status(200).json({ success: true, message: "Attendance status retrieved", data: status });
  },

  // ─── Attendance Log ───────────────────────────────────────
  async getAttendanceLog(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const sortBy = (req.query.sortBy as string) || "date";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    const result = await orderWorkerService.getAttendanceLog(
      employeeId, page, limit, month, year, sortBy, sortOrder,
    );
    res.status(200).json({ success: true, message: "Attendance history retrieved", ...result });
  },

  // ─── Attendance Report (admin) ────────────────────────────
  async getAttendanceReport(req: Request, res: Response) {
    const { outletId } = res.locals.payload;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || "firstName";
    const sortOrder = (req.query.sortOrder as string) || "asc";

    const result = await orderWorkerService.getAttendanceReport(
      outletId, page, limit, startDate, endDate, status, search, sortBy, sortOrder,
    );
    res.status(200).json({ success: true, message: "Attendance report retrieved", ...result });
  },

  async getEmployeeAttendanceReport(req: Request, res: Response) {
    const { outletId } = res.locals.payload;
    const employeeId = req.params.employeeId as string;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const status = req.query.status as string | undefined;
    const sortBy = (req.query.sortBy as string) || "date";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    const result = await orderWorkerService.getEmployeeAttendanceReport(
      outletId, employeeId, page, limit, startDate, endDate, status, sortBy, sortOrder,
    );
    res.status(200).json({ success: true, message: "Employee attendance report retrieved", data: result });
  },
};
