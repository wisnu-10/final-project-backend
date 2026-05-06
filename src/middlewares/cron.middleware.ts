import { Request, Response, NextFunction } from "express";

export const validateCronSecret = (req: Request, res: Response, next: NextFunction) => {
  const secret = req.headers["x-cron-secret"];
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error("[CRON]: CRON_SECRET is not defined in environment variables");
    return res.status(500).json({ message: "Internal Server Error: Cron Configuration Missing" });
  }

  if (secret !== expectedSecret) {
    console.warn(`[CRON]: Unauthorized attempt to trigger cron job from IP: ${req.ip}`);
    return res.status(401).json({ message: "Unauthorized: Invalid Cron Secret" });
  }

  next();
};
