import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma-client.config";
import AppError from "../helpers/app-error.helper";

export function attendanceCheck() {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = res.locals.payload;

      if (!employeeId) {
        return next(AppError("Employee authentication required", 401));
      }

      const today = new Date();
      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      const attendance = await prisma.attendance.findFirst({
        where: {
          employeeId,
          date: todayDate,
          deletedAt: null,
        },
      });

      if (!attendance) {
        return next(
          AppError(
            "Anda harus melakukan absensi terlebih dahulu sebelum memproses pesanan. Silakan check-in di halaman attendance.",
            403,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
