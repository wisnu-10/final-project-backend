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

router.get("/available", orderWorkerController.getAvailableTasks);
router.get("/my-tasks", orderWorkerController.getMyTasks);
router.post("/accept", orderWorkerController.acceptTask);
router.post("/complete", orderWorkerController.completeTask);
router.get("/history", orderWorkerController.getWorkerHistory);
router.get("/:id", orderWorkerController.getOrderDetail);

export default router;