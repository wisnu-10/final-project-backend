import { Router } from "express";
import { superAdminController } from "./super-admin.controller";
import { jwtVerifyEmployee, employeeRoleVerify } from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";
import { registerEmployeeValidator } from "./validators/register-employee.validator";
import { updateEmployeeValidator } from "./validators/update-employee.validator";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";

const router = Router();

router.use(jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!));
router.use(employeeRoleVerify(["super_admin"]));

router.post(
  "/register-employee",
  registerEmployeeValidator,
  expressRequestValidation,
  superAdminController.register,
);
router.put(
  "/update-employee/:id",
  updateEmployeeValidator,
  expressRequestValidation,
  superAdminController.updateEmployee,
);
router.get("/get-employees", superAdminController.getEmployees);
router.get("/get-employee/:id", superAdminController.getEmployeeById);
router.delete("/delete-employee/:id", superAdminController.deleteEmployee);
router.get("/dashboard-stats", superAdminController.getDashboardStats);

export default router;