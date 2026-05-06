import express, { Request, Response, NextFunction } from "express";
import authRouter from "./modules/auth/auth.router";
import authEmployeeRouter from "./modules/auth-employee/auth-employee.router";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/cors.config";
import cors from "cors";
import passport from "./config/passport.config";
import profileCustomerRouter from "./modules/profile-customer/profile-customer.router";
import attendanceRouter from "./modules/attendance/attendance.router";
import shiftRouter from "./modules/shift/shift.router";
import addressCustomerRouter from "./modules/address-customer/address-customer.router";
import orderCustomerRouter from "./modules/order-customer/order-customer.router";
import orderAdminRouter from "./modules/order-admin/order-admin.router";
import orderWorkerRouter from "./modules/order-worker/order-worker.router";
import orderDriverRouter from "./modules/order-driver/order-driver.router";
import bypassRequestRouter from "./modules/bypass-request/bypass-request.router";
import outletRouter from "./modules/outlet/outlet.router";
import laundryItemRouter from "./modules/outlet/laundry-item/laundry-item.router";
import regionRouter from "./modules/region/region.router";
import superAdminRouter from "./modules/super-admin/super-admin.router";
import complaintRouter from "./modules/complaint-customer/complaint-customer-router"
import reportRouter from "./modules/report/report.router"
import { expirySchedule } from "./helpers/jobs/expiry-schema";
import paymentCustomerRouter from "./modules/payment-customer/payment-customer.router"
import cronRouter from "./modules/cron/cron.router";

const PORT = process.env.PORT || 8000;
export const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// expirySchedule() // Commented out to use cron-job.org external trigger instead

// Auth & Session
app.use("/auth", authRouter);
app.use("/auth-employee", authEmployeeRouter);
app.use("/profile", profileCustomerRouter);

// Attendance & HR
app.use("/api/attendance", attendanceRouter);
app.use("/api/shifts", shiftRouter);

// Core Business Logic
app.use("/api/worker-tasks", orderWorkerRouter);
app.use("/order-admin", orderAdminRouter);
app.use("/order-driver", orderDriverRouter);
app.use("/order", orderCustomerRouter);
app.use("/bypass-request", bypassRequestRouter);

// External Job Triggers (cron-job.org)
app.use("/jobs", cronRouter);

// Master Data & Regions
app.use("/address", addressCustomerRouter);
app.use("/super-admin/outlets", outletRouter);
app.use("/super-admin", superAdminRouter);
app.use("/laundry-items", laundryItemRouter);
app.use("/region", regionRouter);
app.use('/complaint', complaintRouter)
app.use("/payments", paymentCustomerRouter);

// Reports & Analytics`
app.use("/report", reportRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  const statusCode = err.expose === true ? err.statusCode : 500;
  const message = err.expose === true ? err.message : "Something went wrong";

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    expirySchedule()
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;