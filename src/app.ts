import express, { Request, Response, NextFunction } from "express";
import authRouter from "./modules/auth/auth.router";
import authEmployeeRouter from "./modules/auth-employee/auth-employee.router";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/cors.config";
import cors from "cors";
import passport from "./config/passport.config";
import profileCustomerRouter from "./modules/profile-customer/profile-customer.router";
import superAdminRouter from "./modules/super-admin/super-admin.router";
import addressCustomerRouter from "./modules/address-customer/address-customer.router";

import orderCustomerRouter from "./modules/order-customer/order-customer.router";
import outletRouter from "./modules/outlet/outlet.router";
import laundryItemRouter from "./modules/outlet/laundry-item/laundry-item.router";
import regionRouter from "./modules/region/region.router";

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/auth", authRouter);
app.use("/auth-employee", authEmployeeRouter);
app.use("/profile", profileCustomerRouter);
app.use("/super-admin", superAdminRouter);

app.use("/order", orderCustomerRouter);
app.use("/address", addressCustomerRouter);
app.use("/super-admin/outlets", outletRouter);
app.use("/laundry-items", laundryItemRouter);
app.use("/region", regionRouter); // Public — untuk autocomplete dropdown frontend

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
