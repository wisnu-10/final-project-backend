import { Router } from "express";
import { orderDriverController } from "./order-driver.controller";
import {
  jwtVerifyEmployee,
  employeeRoleVerify,
} from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";

const router = Router();

router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));
router.use(employeeRoleVerify(["driver"]));

router.get("/available", orderDriverController.getAvailableTasks);
router.get("/my-tasks", orderDriverController.getMyTasks);
router.post("/accept-pickup", orderDriverController.acceptPickup);
router.post("/complete-pickup", orderDriverController.completePickup);
router.post("/accept-delivery", orderDriverController.acceptDelivery);
router.post("/complete-delivery", orderDriverController.completeDelivery);
router.get("/history", orderDriverController.getDriverHistory);

export default router;
