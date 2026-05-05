import { NextFunction, Request, Response } from "express";
import AppError from "../helpers/app-error.helper";
import jwt from "jsonwebtoken";

export function jwtVerifyProfile(secretKey: string) {
  return function (req: Request, res: Response, next: NextFunction) {
    const token = req?.cookies?.updatePasswordToken;

    if (!token) throw AppError("Session expired", 401);

    try {
      const payload = jwt.verify(token, secretKey);
      
      res.locals.payload = payload;
      
      next();
    } catch (error: any) {
      return next(
        AppError(
          "Your session is invalid or has expired.",
          401,
        ),
      );
    }
  };
}