import { body } from "express-validator";

export const updateOutletValidator = [
  body("name")
    .optional()
    .isString()
    .withMessage("Outlet name must be a string"),

  body("address")
    .optional()
    .isString()
    .withMessage("Address must be a string"),

  body("districtId")
    .optional()
    .isNumeric()
    .withMessage("District ID must be a number"),

  body("districtName")
    .optional()
    .isString()
    .withMessage("District name must be a string"),

  body("cityId")
    .optional()
    .isNumeric()
    .withMessage("City ID must be a number"),

  body("cityName")
    .optional()
    .isString()
    .withMessage("City name must be a string"),

  body("provinceId")
    .optional()
    .isNumeric()
    .withMessage("Province ID must be a number"),

  body("provinceName")
    .optional()
    .isString()
    .withMessage("Province name must be a string"),

  body("postalCode")
    .optional()
    .isPostalCode("ID")
    .withMessage("Invalid postal code format"),

  body("maxServiceDistance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max service distance must be a positive number"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  // latitude & longitude TIDAK dibutuhkan dari frontend
  // Jika address/wilayah berubah, koordinat akan di-re-geocode otomatis
];
