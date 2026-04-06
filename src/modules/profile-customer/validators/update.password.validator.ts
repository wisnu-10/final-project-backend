import { body, cookie} from "express-validator";

export const updatePasswordValidator = [
  cookie("accessToken")
    .notEmpty()
    .withMessage("The login session can't be found, please log in first"),

  body("newPassword")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter"),
];