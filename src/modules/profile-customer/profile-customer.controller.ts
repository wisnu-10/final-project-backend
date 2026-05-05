import { Request, Response } from "express";
import { profileCustomerService } from "./profile-customer.service";
import multer from "multer";
import AppError from "../../helpers/app-error.helper";

export const profileCustomerController = {
  async getProfile(req: Request, res: Response) {
    const { customerId } = res.locals.payload;

    const customer = await profileCustomerService.getProfile(customerId);

    res.status(200).json({
      success: true,
      message: "Get profile success",
      data: customer,
    });
  },

  async updateProfile(req: Request, res: Response) {
    const { customerId } = res.locals.payload;
    const { firstName, lastName, phoneNumber } = req.body;
    const profilePicture = req.file as Express.Multer.File;

    const customer = await profileCustomerService.updateProfile(
      customerId,
      profilePicture,
      {
        firstName,
        lastName,
        phoneNumber,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Update profile success",
      data: customer,
    });
  },

  async updateEmail(req: Request, res: Response) {
    const { customerId } = res.locals.payload;

    const { newEmail } = req.body;

    await profileCustomerService.updateEmail(customerId, newEmail);

    res.status(200).json({
      success: true,
      message: "Update password success",
      data: newEmail,
    });
  },

  async confirmEmail(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) throw AppError("Token must be provide", 401);

    await profileCustomerService.confirmEmail(token);

    res.status(200).json({
      success: true,
      message: "New email is successfully confirmed",
      data: [],
    });
  },

  async updatePassword(req: Request, res: Response) {
    const { customerId } = res.locals.payload;

    const { oldPassword, newPassword } = req.body;

    await profileCustomerService.updatePassword(
      customerId,
      oldPassword,
      newPassword

    );

    res.status(200).json({
      success: true,
      message: "New password has been updated",
      data: [],
    });
  },
};
