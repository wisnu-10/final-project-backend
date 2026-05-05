import { Request, Response } from "express";
import { attendanceService } from "./attendance.service";
import { attendanceReportService } from "./attendance-report.service";

function parseReportQuery(query: any) {
  return {
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 10,
    startDate: query.startDate as string | undefined,
    endDate: query.endDate as string | undefined,
    status: query.status as string | undefined,
    search: query.search as string | undefined,
    sortBy: (query.sortBy as string) || "firstName",
    sortOrder: (query.sortOrder as string) || "asc",
  };
}

export const attendanceController = {
  async checkIn(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const { shiftId, notes } = req.body;
    const attendance = await attendanceService.checkIn(employeeId, shiftId, notes);

    const message = attendance.status === "present"
      ? "Check-in berhasil! Anda tepat waktu ✅"
      : "Check-in berhasil, namun Anda terlambat ⚠️";

    res.status(201).json({ success: true, message, data: attendance });
  },

  async checkOut(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const attendance = await attendanceService.checkOut(employeeId);
    res.status(200).json({ success: true, message: "Check-out berhasil! 👋", data: attendance });
  },

  async getStatus(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const status = await attendanceService.getStatus(employeeId);
    res.status(200).json({ success: true, message: "Attendance status retrieved", data: status });
  },

  async getHistory(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const sortBy = (req.query.sortBy as string) || "date";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    const result = await attendanceService.getHistory(
      employeeId, page, limit, month, year, sortBy, sortOrder,
    );
    res.status(200).json({ success: true, message: "Attendance history retrieved", ...result });
  },

  async getReport(req: Request, res: Response) {
    const { outletId } = res.locals.payload;
    const q = parseReportQuery(req.query);

    const result = await attendanceReportService.getReport(
      outletId, q.page, q.limit, q.startDate, q.endDate, q.status, q.search, q.sortBy, q.sortOrder,
    );
    res.status(200).json({ success: true, message: "Attendance report retrieved", ...result });
  },

  async getEmployeeReport(req: Request, res: Response) {
    const { outletId } = res.locals.payload;
    const employeeId = req.params.employeeId as string;
    const q = parseReportQuery(req.query);

    // sortBy for attendance must be an Attendance field, not Employee field
    const validAttendanceSortFields = ["date", "status", "checkIn", "checkOut", "createdAt"];
    const sortBy = validAttendanceSortFields.includes(q.sortBy) ? q.sortBy : "date";

    const result = await attendanceReportService.getEmployeeReport(
      outletId, employeeId, q.page, q.limit, q.startDate, q.endDate, q.status, sortBy, q.sortOrder,
    );
    res.status(200).json({ success: true, message: "Employee attendance report retrieved", data: result });
  },
};
