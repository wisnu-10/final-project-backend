import { body, cookie } from "express-validator";

export const updateProfileValidator = [
  cookie("accessToken")
    .notEmpty()
    .withMessage("The login session can't be found, please log in first"),

  body("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .isAlpha('en-US', { ignore: ' ' })
    .withMessage("First name should only contain letters"),

  body("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .isAlpha('en-US', { ignore: ' ' })
    .withMessage("Last name should only contain letters"),

  body("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("id-ID")
    .withMessage("Invalid Indonesian phone number format"),
];