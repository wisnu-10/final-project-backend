import { body, header } from "express-validator";

export const authActivationValidator = [
  header("authorization")
    .notEmpty()
    .withMessage("Activation token is required")
    .custom((value) => {
    
    if (!value.startsWith("Bearer ")) {
      throw new Error("Invalid token format, must be Bearer token");
    }
    
    const token = value.split(" ")[1];
    
    return true;
  }),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter"),
];