import { Router } from "express";
import { outletController } from "./outlet.controller";
import { jwtVerifyEmployee, employeeRoleVerify } from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";
import { createOutletValidator } from "./validators/create-outlet.validator";
import { updateOutletValidator } from "./validators/update-outlet.validator";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";

const router = Router();

router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));
router.use(employeeRoleVerify(["super_admin"]));

router.post("/", createOutletValidator, expressRequestValidation, outletController.createOutlet);
router.get("/", outletController.getOutlets);
router.get("/:id", outletController.getOutletById);
router.put("/:id", updateOutletValidator, expressRequestValidation, outletController.updateOutlet);
router.delete("/:id", outletController.deleteOutlet);

export default router;
