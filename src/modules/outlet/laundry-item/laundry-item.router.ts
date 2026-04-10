import { Router } from "express";
import { laundryItemController } from "./laundry-item.controller";
import { jwtVerifyEmployee, employeeRoleVerify } from "../../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../../config/main.config";
import { createLaundryItemValidator } from "./validators/create-laundry-item.validator";
import { updateLaundryItemValidator } from "./validators/update-laundry-item.validator";
import { expressRequestValidation } from "../../../middlewares/express-request-validation.middleware";

const router = Router();

// Both super_admin and outlet_admin can manage laundry items
router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));
router.use(employeeRoleVerify(["super_admin", "outlet_admin"]));

router.post(
  "/",
  createLaundryItemValidator,
  expressRequestValidation,
  laundryItemController.createLaundryItem,
);
router.get("/", laundryItemController.getLaundryItems);
router.get("/:id", laundryItemController.getLaundryItemById);
router.put(
  "/:id",
  updateLaundryItemValidator,
  expressRequestValidation,
  laundryItemController.updateLaundryItem,
);
router.delete("/:id", laundryItemController.deleteLaundryItem);

export default router;
