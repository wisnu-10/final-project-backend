import { Request, Response } from "express";
import { CreateLaundryItemDTO, UpdateLaundryItemDTO } from "../../../types/laundry-item.dto";
import { laundryItemService } from "./laundry-item.service";

export const laundryItemController = {
  async createLaundryItem(req: Request, res: Response) {
    const data = req.body as CreateLaundryItemDTO;

    const item = await laundryItemService.createLaundryItem(data);

    res.status(201).json({
      success: true,
      message: "Laundry item created successfully",
      data: item,
    });
  },

  async getLaundryItems(req: Request, res: Response) {
    const { search, pricingType, page, limit } = req.query;

    const data = await laundryItemService.getLaundryItems({
      search: search as string,
      pricingType: pricingType as string,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    res.status(200).json({
      success: true,
      message: "Laundry items fetched successfully",
      data,
    });
  },

  async getLaundryItemById(req: Request, res: Response) {
    const { id } = req.params;

    const data = await laundryItemService.getLaundryItemById(id as string);

    res.status(200).json({
      success: true,
      message: "Laundry item fetched successfully",
      data,
    });
  },

  async updateLaundryItem(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body as UpdateLaundryItemDTO;

    const item = await laundryItemService.updateLaundryItem(id as string, data);

    res.status(200).json({
      success: true,
      message: "Laundry item updated successfully",
      data: item,
    });
  },

  async deleteLaundryItem(req: Request, res: Response) {
    const { id } = req.params;

    const data = await laundryItemService.deleteLaundryItem(id as string);

    res.status(200).json({
      success: true,
      message: "Laundry item deleted successfully",
      data,
    });
  },
};
