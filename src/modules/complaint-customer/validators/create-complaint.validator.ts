import { body, cookie } from "express-validator";

export const createComplaintValidator = [
  cookie("accessToken")
    .notEmpty()
    .withMessage("The login session can't be found, please log in first"),

  body("invoiceNumber").notEmpty().withMessage("Invoice Number is required"),

  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .trim(),
];
