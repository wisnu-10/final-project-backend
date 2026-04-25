import { Router } from "express";
import { reportController } from "./report.controller";
import {
  jwtVerifyEmployee,
  employeeRoleVerify,
} from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";

const router = Router();

// Both super_admin and outlet_admin can access reports
router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));
router.use(employeeRoleVerify(["super_admin", "outlet_admin"]));

// Sales income report
router.get("/sales", reportController.getSalesReport);

// Employee performance report
router.get("/employee-performance", reportController.getEmployeePerformance);

export default router;
