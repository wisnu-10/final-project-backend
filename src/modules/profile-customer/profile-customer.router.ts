import { Router } from "express";
import { profileCustomerController } from "./profile-customer.controller";
import { jwtVerify, roleverify } from "../../middlewares/auth.middleware";
import { JWT_TOKEN_SECRET_KEY, JWT_UPDATE_PASSWORD_SECRET_KEY } from "../../config/main.config";
import { multerUpload } from "../../helpers/multer.helper";
import { authForgotPasswordValidator } from "../auth/validators/auth-forgot-password.validation";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";
import { updatePasswordValidator } from "./validators/update.password.validator";
import { updateEmailValidator } from "./validators/update-email.validator";
import { verifyPasswordValidator } from "./validators/verify-password.validation";
import { jwtVerifyProfile } from "../../middlewares/profile-customer.middleware";

const router = Router();

router.get(
  "/me",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  profileCustomerController.getProfile,
);

router.put(
  "/update",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  multerUpload(
    "src/uploads",
    "IMG-MENU",
    ["jpg", "jpeg", "png", "svg", "webp"],
    "memory",
  ).single("image"),
  profileCustomerController.updateProfile,
);

router.patch(
  "/update-email",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  updateEmailValidator,
  expressRequestValidation,
  profileCustomerController.updateEmail,
);

router.patch("/confirm-email", profileCustomerController.confirmEmail);

router.post(
  "/verify-password",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  verifyPasswordValidator,
  expressRequestValidation,
  profileCustomerController.verifyPassword,
);

router.patch(
  "/update-password",
  jwtVerifyProfile(JWT_UPDATE_PASSWORD_SECRET_KEY!),
  roleverify(["customer"]),
  updatePasswordValidator,
  expressRequestValidation,
  profileCustomerController.updatePassword,
); 

export default router;
