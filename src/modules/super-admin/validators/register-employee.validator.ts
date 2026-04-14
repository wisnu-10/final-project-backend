import { body } from "express-validator";

export const registerEmployeeValidator = [
  body("firstName").notEmpty().withMessage("First name is required"),

  body("lastName").notEmpty().withMessage("Last name is required"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("phoneNumber").notEmpty().withMessage("Phone number is required"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["worker", "driver", "outlet_admin", "super_admin"])
    .withMessage(
      "Role must be either worker or driver or outlet admin or super admin",
    ),

  body("outletId")
    .optional()
    .isUUID()
    .withMessage("Outlet ID must be a valid UUID"),

  body("identityNumber")
    .optional()
    .isLength({ min: 16, max: 16 })
    .withMessage("Identity number must be exactly 16 digits")
    .isNumeric()
    .withMessage("Identity number must contain only numbers"),

  body("bankAccountNumber")
    .optional()
    .isNumeric()
    .withMessage("Bank account number must contain only numbers"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
];
