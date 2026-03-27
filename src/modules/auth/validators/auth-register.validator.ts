import { body } from "express-validator";

export const authRegisterValidator = [
  body("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .isAlpha()
    .withMessage("First name should only contain letters"),

  body("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .isAlpha()
    .withMessage("Last name should only contain letters"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("id-ID")
    .withMessage("Invalid Indonesian phone number format"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["customer"])
    .withMessage("Invalid role for this registration"),

];