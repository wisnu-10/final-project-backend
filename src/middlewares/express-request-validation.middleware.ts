import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import AppError from "../helpers/app-error.helper";

export function expressRequestValidation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const errors = validationResult(req);
  console.log(errors?.array());
  if (!errors?.isEmpty()) throw AppError(errors?.array()[0].msg, 400);

  next();
}
