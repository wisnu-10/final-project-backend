import { Router } from "express";
import { orderWorkerController } from "./order-worker.controller";
import {
  jwtVerifyEmployee,
  employeeRoleVerify,
} from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";

const router = Router();

// All routes require worker auth
router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));
router.use(employeeRoleVerify(["worker"]));

// Get list of orders assigned to this worker
router.get("/", orderWorkerController.getWorkerOrders);

// Get limited order detail
router.get("/:id", orderWorkerController.getWorkerOrderDetail);

export default router;
