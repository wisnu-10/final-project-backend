import { body } from "express-validator";

export const updateLaundryItemValidator = [
  body("name")
    .optional()
    .isString()
    .withMessage("Item name must be a string"),

  body("pricingType")
    .optional()
    .isIn(["kiloan", "per_item"])
    .withMessage("Pricing type must be 'kiloan' or 'per_item'"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
];
