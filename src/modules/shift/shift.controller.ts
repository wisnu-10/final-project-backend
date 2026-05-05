import { Request, Response } from "express";
import { shiftService } from "./shift.service";

export const shiftController = {
  async create(req: Request, res: Response) {
    const { shiftName, startTime, endTime } = req.body;
    const shift = await shiftService.create(shiftName, startTime, endTime);
    res.status(201).json({ success: true, message: "Shift created successfully", data: shift });
  },

  async findAll(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || "startTime";
    const sortOrder = (req.query.sortOrder as string) || "asc";

    const result = await shiftService.findAll(page, limit, search, sortBy, sortOrder);
    res.status(200).json({ success: true, message: "Shifts retrieved successfully", data: result });
  },

  async findById(req: Request, res: Response) {
    const id = req.params.id as string;
    const shift = await shiftService.findById(id);
    res.status(200).json({ success: true, message: "Shift retrieved successfully", data: shift });
  },

  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const { shiftName, startTime, endTime } = req.body;
    const shift = await shiftService.update(id, shiftName, startTime, endTime);
    res.status(200).json({ success: true, message: "Shift updated successfully", data: shift });
  },

  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    await shiftService.delete(id);
    res.status(200).json({ success: true, message: "Shift deleted successfully", data: null });
  },
};
