import { body } from "express-validator";

export const createManualOrderValidator = [
  body("customerId")
    .notEmpty()
    .withMessage("Customer is required.")
    .isUUID()
    .withMessage("Invalid customer ID."),

  body("totalWeight")
    .notEmpty()
    .withMessage("Total weight is required.")
    .isFloat({ gt: 0 })
    .withMessage("Total weight must be more than 0."),

  body("workerId")
    .notEmpty()
    .withMessage("Worker assignment is required.")
    .isUUID()
    .withMessage("Invalid worker ID."),

  body("orderItems")
    .isArray()
    .withMessage("Order items must be an array."),

  body("orderItems.*.laundryItemId")
    .isUUID()
    .withMessage("Invalid laundry item ID."),

  body("orderItems.*.quantity")
    .isInt({ gt: 0 })
    .withMessage("Quantity must be at least 1."),
];
