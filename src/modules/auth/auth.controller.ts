import { Request, Response } from "express";
import { LoginDTO, RegisterDTO } from "../../types/auth.dto";
import { authService } from "./auth.service";
import AppError from "../../helpers/app-error.helper";
import { body } from "express-validator";
import { POS_APP_URL, NODE_ENV } from "../../config/main.config";

export const authController = {
  async register(req: Request, res: Response) {
    const register = req.body as RegisterDTO;

    await authService.register(register);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        firstName: register.firstName,
        lastName: register.lastName,
        phoneNumber: register.phoneNumber,
        email: register.email,
        role: register.role,
      },
    });
  },

  async activation(req: Request, res: Response) {
    const { password } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) throw AppError("Token must be provide", 401);

    await authService.activation(password, token);

    res.status(200).json({
      success: true,
      message: "Activation account Successfully",
      data: [],
    });
  },

  async login(req: Request, res: Response) {
    const login = req.body as LoginDTO;

    const { id, email, role, token, firstName } =
      await authService.login(login);

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      status: true,
      message: "User logged in successfully",
      data: {
        id,
        email,
        role: role,
        firstName,
      },
    });
  },

  async session(req: Request, res: Response) {
    const { customerId } = res.locals.payload;

    const { firstName, email, role, profilePicture } = await authService.session(customerId);

    res.status(200).json({
      success: true,
      message: "User auth is successful",
      data: {
        firstName,
        email,
        role,
        profilePicture
      },
    });
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: "Forgot password is successful",
      data: {
        email,
      },
    });
  },

  async resetPassword(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;

    const { password } = req.body;

    const { email } = await authService.resetPassword(token, password);

    res.status(200).json({
      success: true,
      message: "Reset password is successful",
      data: { email },
    });
  },

  async logout(req: Request, res: Response) {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },

  async authGoogleCallback(req: Request, res: Response) {
    const user = req.user as any; // User dapet dari passport

    const token = await authService.authGoogleCallback(user.id);

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${POS_APP_URL}`);
  },

  async employeeLogin(req: Request, res: Response) {
    const { email, password } = req.body;

    const { id, role, outletId, firstName, token } =
      await authService.employeeLogin({ email, password });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
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
        outletId,
        firstName,
      },
    });
  },

  async employeeSession(req: Request, res: Response) {
    const { employeeId } = res.locals.payload;

    const employee = await authService.employeeSession(employeeId);

    res.status(200).json({
      success: true,
      message: "Employee session is valid",
      data: employee,
    });
  },
};
