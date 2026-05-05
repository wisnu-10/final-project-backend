import { body, cookie } from "express-validator";

export const updateEmailValidator = [
    cookie("accessToken")
          .notEmpty()
          .withMessage("The login session can't be found, please log in first"),
    
    body("newEmail")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
]