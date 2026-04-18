import { Router } from "express";
import { jwtVerify, roleverify } from "../../middlewares/auth.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";
import { complaintCustomerController } from "./complaint-customer-controller";
import { createComplaintValidator } from "./validators/create-complaint.validator";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";
import { employeeRoleVerify, jwtVerifyEmployee } from "../../middlewares/auth-employee.middleware";

const router = Router()

router.post(
  "/create-complaint",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  createComplaintValidator,
  expressRequestValidation,
  complaintCustomerController.createComplaint
);

router.get("/", jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!), employeeRoleVerify(["super_admin", "outlet_admin"]), complaintCustomerController.getComplaints)

router.patch(
  "/:id/resolve",
  jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!),
  employeeRoleVerify(["super_admin", "outlet_admin"]),
  complaintCustomerController.resolveComplaint
);

router.get(
  "/:id",
  jwtVerifyEmployee(JWT_TOKEN_SECRET_KEY!),
  employeeRoleVerify(["super_admin", "outlet_admin"]),
  complaintCustomerController.getComplaintById,
);

export default router