import { body, cookie } from "express-validator";

export const createOrderValidator = [
  cookie("accessToken")
    .notEmpty()
    .withMessage("The login session can't be found, please log in first"),

  body("scheduleTime")
    .notEmpty()
    .withMessage("Pickup schedule is required.")
    .isISO8601()
    .withMessage("Invalid date format. Please use a valid ISO8601 string.")
    .custom((value) => {
      const selectedDate = new Date(value);
      const now = new Date();
      if (selectedDate < now) {
        throw new Error(
          "Pickup time cannot be in the past. Let’s look forward",
        );
      }
      return true;
    }),

  body("pickupAddressId")
    .notEmpty()
    .withMessage("Pickup address ID is required.")
    .isUUID()
    .withMessage("Pickup address ID must be a valid UUID."),

  body("deliveryAddressId")
    .notEmpty()
    .withMessage("Delivery address ID is required.")
    .isUUID()
    .withMessage("Delivery address ID must be a valid UUID."),
];
