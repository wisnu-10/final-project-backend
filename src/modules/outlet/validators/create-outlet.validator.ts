import { body } from "express-validator";

export const createOutletValidator = [
  body("name")
    .notEmpty()
    .withMessage("Outlet name is required")
    .isString()
    .withMessage("Outlet name must be a string"),

  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isString()
    .withMessage("Address must be a string"),

  body("districtId")
    .notEmpty()
    .withMessage("District ID is required")
    .isNumeric()
    .withMessage("District ID must be a number"),

  body("districtName")
    .notEmpty()
    .withMessage("District name is required")
    .isString()
    .withMessage("District name must be a string"),

  body("cityId")
    .notEmpty()
    .withMessage("City ID is required")
    .isNumeric()
    .withMessage("City ID must be a number"),

  body("cityName")
    .notEmpty()
    .withMessage("City name is required")
    .isString()
    .withMessage("City name must be a string"),

  body("provinceId")
    .notEmpty()
    .withMessage("Province ID is required")
    .isNumeric()
    .withMessage("Province ID must be a number"),

  body("provinceName")
    .notEmpty()
    .withMessage("Province name is required")
    .isString()
    .withMessage("Province name must be a string"),

  body("postalCode")
    .notEmpty()
    .withMessage("Postal code is required")
    .isPostalCode("ID")
    .withMessage("Invalid postal code format"),

  body("maxServiceDistance")
    .notEmpty()
    .withMessage("Max service distance is required")
    .isFloat({ min: 0 })
    .withMessage("Max service distance must be a positive number"),

  body("isActive")
    .notEmpty()
    .withMessage("isActive is required")
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  // latitude & longitude TIDAK dibutuhkan dari frontend
  // Koordinat didapat otomatis dari OpenCage berdasarkan alamat yang diberikan
];
