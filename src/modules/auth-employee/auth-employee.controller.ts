import { Request, Response } from "express";
import { LoginDTO } from "../../types/auth.dto";
import { authEmployeeService } from "./auth-employee.service";
import { NODE_ENV } from "../../config/main.config";

export const authEmployeeController = {
  async login(req: Request, res: Response) {
    const login = req.body as LoginDTO;

    const { id, email, role, token, firstName, lastName, outletId, outletName } =
      await authEmployeeService.login(login);

    res.cookie("employeeAccessToken", token, {
      httpOnly: true,
      secure: NODE_ENV === "production" ? true : false,
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Employee logged in successfully",
      data: {
        id,
        email,
        role,
        firstName,
        lastName,
        outletId,
        outletName,
      },
    });
  },

  async session(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;

    const data = await authEmployeeService.session(employeeId);

    res.status(200).json({
      success: true,
      message: "Employee session is valid",
      data,
    });
  },

  async logout(req: Request, res: Response) {
    res.clearCookie("employeeAccessToken", {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Employee logged out successfully",
    });
  },

  async verifyEmail(req: Request, res: Response) {
    const token = req.params.token as string;
    const data = await authEmployeeService.verifyEmail(token);
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data,
    });
  },
};
