import { body } from "express-validator";

const validStations = ["washing", "ironing", "packing"];

export const createBypassRequestValidator = [
  body("notes")
    .notEmpty()
    .withMessage("Notes is required. Please explain the reason for this bypass request.")
    .isString()
    .withMessage("Notes must be a string."),

  body("expectedQuantity")
    .notEmpty()
    .withMessage("Expected quantity is required.")
    .isInt({ gt: 0 })
    .withMessage("Expected quantity must be a positive integer."),

  body("actualQuantity")
    .notEmpty()
    .withMessage("Actual quantity is required.")
    .isInt({ min: 0 })
    .withMessage("Actual quantity must be a non-negative integer."),

  body("station")
    .notEmpty()
    .withMessage("Station is required.")
    .isIn(validStations)
    .withMessage(
      `Station must be one of: ${validStations.join(", ")}.`,
    ),
];
