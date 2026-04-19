import { Router } from "express";
import { attendanceController } from "./attendance.controller";
import {
  attendanceHistoryValidator,
  attendanceReportValidator,
} from "./validators/attendance.validator";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";
import {
  jwtVerifyEmployee,
  employeeRoleVerify,
} from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";

const router = Router();

// All attendance routes require authentication
router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));

// Driver & Worker routes
router.post(
  "/check-in",
  employeeRoleVerify(["driver", "worker"]),
  attendanceController.checkIn,
);

router.post(
  "/check-out",
  employeeRoleVerify(["driver", "worker"]),
  attendanceController.checkOut,
);

router.get(
  "/status",
  employeeRoleVerify(["driver", "worker"]),
  attendanceController.getStatus,
);

router.get(
  "/history",
  employeeRoleVerify(["driver", "worker"]),
  attendanceHistoryValidator,
  expressRequestValidation,
  attendanceController.getHistory,
);

// Admin routes
router.get(
  "/report",
  employeeRoleVerify(["outlet_admin", "super_admin"]),
  attendanceReportValidator,
  expressRequestValidation,
  attendanceController.getReport,
);

router.get(
  "/report/:employeeId",
  employeeRoleVerify(["outlet_admin", "super_admin"]),
  attendanceReportValidator,
  expressRequestValidation,
  attendanceController.getEmployeeReport,
);

export default router;
