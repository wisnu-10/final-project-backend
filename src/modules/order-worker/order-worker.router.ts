import { Router } from "express";
import { orderWorkerController } from "./order-worker.controller";
import {
  jwtVerifyEmployee,
  employeeRoleVerify,
} from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";

const router = Router();

// All routes require employee auth
router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));

// ─── Worker-only Order Routes ───────────────────────────────
router.get(
  "/",
  employeeRoleVerify(["worker"]),
  orderWorkerController.getWorkerOrders,
);

router.get(
  "/detail/:id",
  employeeRoleVerify(["worker"]),
  orderWorkerController.getWorkerOrderDetail,
);

// ─── Submit Attendance (driver & worker) ────────────────────
router.post(
  "/attendance/check-in",
  employeeRoleVerify(["driver", "worker"]),
  orderWorkerController.submitCheckIn,
);

router.post(
  "/attendance/check-out",
  employeeRoleVerify(["driver", "worker"]),
  orderWorkerController.submitCheckOut,
);

router.get(
  "/attendance/status",
  employeeRoleVerify(["driver", "worker"]),
  orderWorkerController.getAttendanceStatus,
);

// ─── Attendance Log (driver & worker own history) ───────────
router.get(
  "/attendance/log",
  employeeRoleVerify(["driver", "worker"]),
  orderWorkerController.getAttendanceLog,
);

// ─── Attendance Report (admin outlet) ───────────────────────
router.get(
  "/attendance/report",
  employeeRoleVerify(["outlet_admin", "super_admin"]),
  orderWorkerController.getAttendanceReport,
);

router.get(
  "/attendance/report/:employeeId",
  employeeRoleVerify(["outlet_admin", "super_admin"]),
  orderWorkerController.getEmployeeAttendanceReport,
);

export default router;