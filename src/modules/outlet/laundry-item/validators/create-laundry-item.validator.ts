import { body } from "express-validator";

export const createLaundryItemValidator = [
  body("name")
    .notEmpty()
    .withMessage("Item name is required")
    .isString()
    .withMessage("Item name must be a string"),

  body("pricingType")
    .notEmpty()
    .withMessage("Pricing type is required")
    .isIn(["kiloan", "per_item"])
    .withMessage("Pricing type must be 'kiloan' or 'per_item'"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
];
