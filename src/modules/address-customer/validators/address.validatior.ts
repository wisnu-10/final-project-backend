import { cookie } from "express-validator";

const { body } = require("express-validator");

export const addressValidator = [
  cookie("accessToken")
      .notEmpty()
      .withMessage("The login session can't be found, please log in first"),
      
  // Recipient Details
  body("recipientName")
    .notEmpty()
    .withMessage("Recipient name is required")
    .isLength({ min: 3 })
    .withMessage("Recipient name must be at least 3 characters long")
    .trim()
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Recipient name should only contain letters")
    .matches(/^[A-Z][a-z]*(\s[A-Z][a-z]*)*$/)
    .withMessage("The first letter of each word must be capitalized"),

  body("recipientPhoneNumber")
    .notEmpty()
    .withMessage("Recipient phone number is required")
    .isMobilePhone("id-ID")
    .withMessage("Invalid Indonesian phone number format"),

  // Address Labels & Details
  body("label")
    .notEmpty()
    .withMessage("Address label is required (e.g., Home, Office)"),

  body("address")
    .notEmpty()
    .withMessage("Full address is required")
    .isLength({ min: 10 })
    .withMessage("Address should be more detailed (min 10 chars)"),

  // Location IDs (Must be Numbers)
  body(["districtId", "cityId", "provinceId"])
    .isInt({ min: 1 })
    .withMessage("Location ID must be a valid positive integer"),

  // Location Names (Must be Strings)
  body(["districtName", "cityName", "provinceName"])
    .notEmpty()
    .withMessage("Location name is required")
    .isString()
    .withMessage("Location name must be a string"),

  // Postal Code (Standard 5 digits for Indonesia)
  body("postalCode")
    .isLength({ min: 5, max: 5 })
    .withMessage("Postal code must be exactly 5 digits")
    .isNumeric()
    .withMessage("Postal code must contain only numbers"),

  // Coordinates
  body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude range"),

  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude range"),

  // Others
  body("isPrimary")
    .isBoolean()
    .withMessage("isPrimary must be a boolean value"),

  body("notes")
    .optional({ nullable: true })
    .isString()
    .withMessage("Notes must be a string"),
];
