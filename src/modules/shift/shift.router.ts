import { Router } from "express";
import { shiftController } from "./shift.controller";
import {
  createShiftValidator,
  updateShiftValidator,
  shiftListValidator,
} from "./validators/shift.validator";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";
import { jwtVerify, roleverify } from "../../middlewares/auth.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";

const router = Router();

router.use(jwtVerify(JWT_TOKEN_SECRET_KEY!));

router.get("/", shiftListValidator, expressRequestValidation, shiftController.findAll);
router.get("/:id", shiftController.findById);

router.post(
  "/",
  roleverify(["super_admin", "outlet_admin"]),
  createShiftValidator,
  expressRequestValidation,
  shiftController.create,
);

router.put(
  "/:id",
  roleverify(["super_admin", "outlet_admin"]),
  updateShiftValidator,
  expressRequestValidation,
  shiftController.update,
);

router.delete(
  "/:id",
  roleverify(["super_admin", "outlet_admin"]),
  shiftController.delete,
);

export default router;
