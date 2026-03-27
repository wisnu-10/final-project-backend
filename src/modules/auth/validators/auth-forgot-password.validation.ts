import { body } from "express-validator";

export const authForgotPasswordValidator = [
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
]