import { body } from "express-validator";

export const processOrderValidator = [
  body("totalWeight")
    .notEmpty()
    .withMessage("Total weight is required.")
    .isFloat({ gt: 0 })
    .withMessage("Total weight must be a positive number."),

  body("orderItems")
    .isArray({ min: 1 })
    .withMessage("Order items must be an array with at least 1 item."),

  body("orderItems.*.laundryItemId")
    .notEmpty()
    .withMessage("Laundry item ID is required.")
    .isUUID()
    .withMessage("Laundry item ID must be a valid UUID."),

  body("orderItems.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required.")
    .isInt({ gt: 0 })
    .withMessage("Quantity must be a positive integer."),

  body("workerId")
    .notEmpty()
    .withMessage("Worker assignment is required.")
    .isUUID()
    .withMessage("Invalid worker ID."),
];
