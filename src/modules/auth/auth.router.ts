import { Router } from "express";
import { authController } from "./auth.controller";
import { authRegisterValidator } from "./validators/auth-register.validator";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";
import { authActivationValidator } from "./validators/auth-activation.validator";
import { authLoginValidator } from "./validators/auth-login-validator";
import { jwtVerify } from "../../middlewares/auth.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";
import { authForgotPasswordValidator } from "./validators/auth-forgot-password.validation";
import passport from "../../config/passport.config";

const router = Router();

router.post(
  "/register",
  authRegisterValidator,
  expressRequestValidation,
  authController.register,
);
router.patch(
  "/activation",
  authActivationValidator,
  expressRequestValidation,
  authController.activation,
);
router.post(
  "/login",
  authLoginValidator,
  expressRequestValidation,
  authController.login,
);
router.get(
  "/session",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  authController.session,
);
router.post(
  "/forgot-password",
  authForgotPasswordValidator,
  expressRequestValidation,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  authActivationValidator,
  expressRequestValidation,
  authController.resetPassword,
);
router.post("/logout", authController.logout);
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  authController.authGoogleCallback,
);

export default router;
