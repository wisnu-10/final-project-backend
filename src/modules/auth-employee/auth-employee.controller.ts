import { Request, Response } from "express";
import { LoginDTO } from "../../types/auth.dto";
import { authEmployeeService } from "./auth-employee.service";

export const authEmployeeController = {
  async login(req: Request, res: Response) {
    const login = req.body as LoginDTO;

    const { id, email, role, token, firstName, lastName, outletId, outletName } =
      await authEmployeeService.login(login);

    res.cookie("employeeAccessToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
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
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Employee logged out successfully",
    });
  },
};
