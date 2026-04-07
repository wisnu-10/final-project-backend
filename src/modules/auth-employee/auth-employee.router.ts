import { Router } from "express";
import { authEmployeeController } from "./auth-employee.controller";
import { authEmployeeLoginValidator } from "./validators/auth-employee-login.validator";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";
import { jwtVerifyEmployee } from "../../middlewares/auth-employee.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";

const router = Router();

router.post(
  "/login",
  authEmployeeLoginValidator,
  expressRequestValidation,
  authEmployeeController.login,
);

router.get(
  "/session",
  jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!),
  authEmployeeController.session,
);

router.post("/logout", authEmployeeController.logout);

export default router;
