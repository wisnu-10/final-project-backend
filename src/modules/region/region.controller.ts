import { Request, Response } from "express";
import { regionService } from "./region.service";

export const regionController = {
  async getProvinces(req: Request, res: Response) {
    const data = await regionService.getProvinces();

    res.status(200).json({
      success: true,
      message: "Provinces fetched successfully",
      data,
    });
  },

  async getCitiesByProvince(req: Request, res: Response) {
    const { provinceId } = req.params;

    const data = await regionService.getCitiesByProvince(provinceId as string);

    res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      data,
    });
  },

  async getDistrictsByCity(req: Request, res: Response) {
    const { cityId } = req.params;

    const data = await regionService.getDistrictsByCity(cityId as string);

    res.status(200).json({
      success: true,
      message: "Districts fetched successfully",
      data,
    });
  },
};
