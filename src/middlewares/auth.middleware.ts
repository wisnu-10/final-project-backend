import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import AppError from "../helpers/app-error.helper";
import { error } from "node:console";

export function jwtVerify(secretKey: string) {
  return function (req: Request, res: Response, next: NextFunction) {
    const token = req?.cookies?.accessToken;

    if (!token) throw AppError("Session expired or you are not logged in", 401);

    try {
      const payload = jwt.verify(token, secretKey);
      
      res.locals.payload = payload;
      
      next();
    } catch (error: any) {
      return next(
        AppError(
          "Your session is invalid or has expired. Please login again.",
          401,
        ),
      );
    }
  };
}

export function roleverify(allowedRoles: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const { role } = res?.locals?.payload;
    
    const accessRole = allowedRoles.join(" or ").toLowerCase()

    if (!role || !allowedRoles.includes(role))
      throw AppError(`only ${accessRole} can access this page`, 401);

    next();
  };
}
