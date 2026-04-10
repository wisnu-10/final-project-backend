import { Request, Response } from "express";
import { RegisterEmployeeDTO, UpdateEmployeeDTO } from "../../types/auth.dto";
import { superAdminService } from "./super-admin.service";

export const superAdminController = {
  async register(req: Request, res: Response) {
    const data = req.body as RegisterEmployeeDTO;

    const employee = await superAdminService.register(data);

    res.status(201).json({
      success: true,
      message: "Employee registered successfully",
      data: employee,
    });
  },

  async getEmployees(req: Request, res: Response) {
    const { role, outletId, search, page, limit } = req.query;

    const data = await superAdminService.getEmployees({
      role: role as string,
      outletId: outletId as string,
      search: search as string,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    res.status(200).json({
      success: true,
      message: "Employees fetched successfully",
      data,
    });
  },

  async getEmployeeById(req: Request, res: Response) {
    const { id } = req.params;

    const data = await superAdminService.getEmployeeById(id as string);

    res.status(200).json({
      success: true,
      message: "Employee fetched successfully",
      data,
    });
  },

  async deleteEmployee(req: Request, res: Response) {
    const { id } = req.params;

    const data = await superAdminService.deleteEmployee(id as string);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
      data,
    });
  },

  async updateEmployee(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body as UpdateEmployeeDTO;

    const employee = await superAdminService.updateEmployee(id as string, data);

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  },

  async getDashboardStats(req: Request, res: Response) {
    const data = await superAdminService.getDashboardStats();

    res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data,
    });
  },
};
