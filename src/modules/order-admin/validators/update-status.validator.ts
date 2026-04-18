import { body } from "express-validator";

const validStatuses = [
  "washing",
  "ironing",
  "packing",
  "waiting_payment",
  "ready_delivery",
  "delivering",
];

export const updateStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required.")
    .isIn(validStatuses)
    .withMessage(
      `Status must be one of: ${validStatuses.join(", ")}. Status "completed" can only be set by the customer.`,
    ),

  body("workerId")
    .notEmpty()
    .withMessage("Worker ID is required. Please assign a worker for this process.")
    .isUUID()
    .withMessage("Worker ID must be a valid UUID."),
];
