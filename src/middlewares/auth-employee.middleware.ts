import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import AppError from "../helpers/app-error.helper";

export function jwtVerifyEmployee(secretKey: string) {
  return function (req: Request, res: Response, next: NextFunction) {
    const token = req?.cookies?.employeeAccessToken;

    if (!token) {
      throw AppError("Employee session expired or not logged in", 401);
    }

    try {
      const payload = jwt.verify(token, secretKey);
      res.locals.payload = payload;
      next();
    } catch (error: any) {
      return next(
        AppError(
          "Employee session is invalid or has expired. Please login again.",
          401,
        ),
      );
    }
  };
}

export function employeeRoleVerify(allowedRoles: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const { role } = res?.locals?.payload;

    const accessRole = allowedRoles.join(" or ").toLowerCase();

    if (!role || !allowedRoles.includes(role))
      throw AppError(`Only ${accessRole} can access this page`, 403);

    next();
  };
}
