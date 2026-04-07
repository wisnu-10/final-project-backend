import { body } from "express-validator";

export const updateEmployeeValidator = [
  body("firstName")
    .optional()
    .isAlpha("en-US", { ignore: " " })
    .withMessage("First name should only contain letters"),

  body("lastName")
    .optional()
    .isAlpha("en-US", { ignore: " " })
    .withMessage("Last name should only contain letters"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("phoneNumber")
    .optional()
    .isMobilePhone("id-ID")
    .withMessage("Invalid Indonesian phone number format"),

  body("role")
    .optional()
    .isIn(["worker", "driver", "outlet_admin"])
    .withMessage("Role must be either worker or driver or outlet admin"),

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
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter"),
];
