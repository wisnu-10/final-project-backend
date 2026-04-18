import { Router } from "express";
import { bypassRequestController } from "./bypass-request.controller";
import {
  jwtVerifyEmployee,
  employeeRoleVerify,
} from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";
import { createBypassRequestValidator } from "./validators/bypass-request.validator";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";

const router = Router();

// All bypass request routes require employee auth
router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));

// Worker creates a bypass request
router.post(
  "/:orderId",
  employeeRoleVerify(["worker"]),
  createBypassRequestValidator,
  expressRequestValidation,
  bypassRequestController.createBypassRequest,
);

// Get bypass requests for a specific order (worker + outlet_admin)
router.get(
  "/order/:orderId",
  employeeRoleVerify(["worker", "outlet_admin"]),
  bypassRequestController.getBypassRequestsByOrder,
);

// Get all pending bypass requests for the outlet (outlet_admin only)
router.get(
  "/pending",
  employeeRoleVerify(["outlet_admin"]),
  bypassRequestController.getPendingBypassRequests,
);

// Approve a bypass request (outlet_admin only)
router.patch(
  "/:id/approve",
  employeeRoleVerify(["outlet_admin"]),
  bypassRequestController.approveBypassRequest,
);

// Reject a bypass request (outlet_admin only)
router.patch(
  "/:id/reject",
  employeeRoleVerify(["outlet_admin"]),
  bypassRequestController.rejectBypassRequest,
);

export default router;
