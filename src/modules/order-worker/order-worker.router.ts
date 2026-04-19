import { Router } from "express";
import { orderWorkerController } from "./order-worker.controller";
import {
  jwtVerifyEmployee,
  employeeRoleVerify,
} from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";

const router = Router();

router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));
router.use(employeeRoleVerify(["worker"]));

router.get("/my-orders", orderWorkerController.getWorkerOrders);
router.get("/available", orderWorkerController.getAvailableTasks);
router.post("/accept", orderWorkerController.acceptTask);
router.post("/complete", orderWorkerController.completeTask);
router.get("/history", orderWorkerController.getWorkHistory);
router.get("/:id", orderWorkerController.getWorkerOrderDetail);

export default router;
