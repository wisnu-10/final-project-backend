import { body, cookie } from "express-validator";

export const createComplaintValidator = [
  cookie("accessToken")
    .notEmpty()
    .withMessage("The login session can't be found, please log in first"),

  body("orderId")
    .notEmpty()
    .withMessage("Order ID is required")
    .isUUID()
    .withMessage("Invalid Order ID format"),

  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long")
    .trim(),
];
