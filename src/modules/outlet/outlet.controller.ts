import { Request, Response } from "express";
import { CreateOutletDTO, UpdateOutletDTO } from "../../types/outlet.dto";
import { outletService } from "./outlet.service";

export const outletController = {
  async createOutlet(req: Request, res: Response) {
    const data = req.body as CreateOutletDTO;

    const outlet = await outletService.createOutlet(data);

    res.status(201).json({
      success: true,
      message: "Outlet created successfully",
      data: outlet,
    });
  },

  async getOutlets(req: Request, res: Response) {
    const { search, isActive, page, limit } = req.query;

    const data = await outletService.getOutlets({
      search: search as string,
      isActive: isActive as string,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    res.status(200).json({
      success: true,
      message: "Outlets fetched successfully",
      data,
    });
  },

  async getOutletById(req: Request, res: Response) {
    const { id } = req.params;

    const data = await outletService.getOutletById(id as string);

    res.status(200).json({
      success: true,
      message: "Outlet fetched successfully",
      data,
    });
  },

  async updateOutlet(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body as UpdateOutletDTO;

    const outlet = await outletService.updateOutlet(id as string, data);

    res.status(200).json({
      success: true,
      message: "Outlet updated successfully",
      data: outlet,
    });
  },

  async deleteOutlet(req: Request, res: Response) {
    const { id } = req.params;

    const data = await outletService.deleteOutlet(id as string);

    res.status(200).json({
      success: true,
      message: "Outlet deleted successfully",
      data,
    });
  },
};
