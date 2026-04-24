import { Router } from "express";
import { shiftController } from "./shift.controller";
import {
  createShiftValidator,
  updateShiftValidator,
  shiftListValidator,
} from "./validators/shift.validator";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";
import { jwtVerifyEmployee, employeeRoleVerify } from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";

const router = Router();

router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));

router.get("/", shiftListValidator, expressRequestValidation, shiftController.findAll);
router.get("/:id", shiftController.findById);

router.post(
  "/",
  employeeRoleVerify(["super_admin", "outlet_admin"]),
  createShiftValidator,
  expressRequestValidation,
  shiftController.create,
);

router.put(
  "/:id",
  employeeRoleVerify(["super_admin", "outlet_admin"]),
  updateShiftValidator,
  expressRequestValidation,
  shiftController.update,
);

router.delete(
  "/:id",
  employeeRoleVerify(["super_admin", "outlet_admin"]),
  shiftController.delete,
);

export default router;
