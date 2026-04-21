import { Router } from "express";
import { orderAdminController } from "./order-admin.controller";
import {
  jwtVerifyEmployee,
  employeeRoleVerify,
} from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";
import { processOrderValidator } from "./validators/process-order.validator";
import { updateStatusValidator } from "./validators/update-status.validator";
import { createManualOrderValidator } from "./validators/create-manual-order.validator";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";

const router = Router();

// Both super_admin and outlet_admin can access order management
router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));
router.use(employeeRoleVerify(["super_admin", "outlet_admin"]));

// List all orders (role-based filtering handled in service)
router.get("/", orderAdminController.getAllOrders);

// Search customers (for manual order form)
router.get("/customers", orderAdminController.getCustomers);

// Get workers for this outlet (for worker assignment dropdown)
router.get("/workers", orderAdminController.getOutletWorkers);

// Get outlet info (price per kg, etc.)
router.get("/outlet-info", orderAdminController.getOutletInfo);

// Create manual order (walk-in)
router.post(
  "/create-manual",
  employeeRoleVerify(["outlet_admin"]),
  createManualOrderValidator,
  expressRequestValidation,
  orderAdminController.createManualOrder,
);

// Get single order detail
router.get("/:id", orderAdminController.getOrderById);

// Process order (outlet_admin only — input weight + items)
router.post(
  "/:id/process",
  employeeRoleVerify(["outlet_admin"]),
  processOrderValidator,
  expressRequestValidation,
  orderAdminController.processOrder,
);

// Update order status (outlet_admin only)
router.patch(
  "/:id/status",
  employeeRoleVerify(["outlet_admin"]),
  updateStatusValidator,
  expressRequestValidation,
  orderAdminController.updateOrderStatus,
);

export default router;
