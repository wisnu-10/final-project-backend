import { body } from "express-validator";

export const processOrderValidator = [
  body("totalWeight")
    .exists()
    .withMessage("Total weight is required.")
    .isFloat({ min: 0 })
    .withMessage("Total weight must be a non-negative number."),

  body("orderItems")
    .isArray()
    .withMessage("Order items must be an array."),

  body().custom((value) => {
    const weight = Number(value.totalWeight);
    const hasItems = Array.isArray(value.orderItems) && value.orderItems.length > 0;

    if (weight <= 0 && !hasItems) {
      throw new Error(
        "Process failed: You must provide either total weight (for kilo items) or at least one laundry item (for per-item items).",
      );
    }
    return true;
  }),

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
