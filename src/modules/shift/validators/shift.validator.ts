import { body, query } from "express-validator";

export const createShiftValidator = [
  body("shiftName").notEmpty().withMessage("Shift name is required").isString().withMessage("Shift name must be a string"),
  body("startTime").notEmpty().withMessage("Start time is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("Start time must be in HH:mm format"),
  body("endTime").notEmpty().withMessage("End time is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("End time must be in HH:mm format"),
];

export const updateShiftValidator = [
  body("shiftName").optional().isString().withMessage("Shift name must be a string"),
  body("startTime").optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("Start time must be in HH:mm format"),
  body("endTime").optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("End time must be in HH:mm format"),
];

export const shiftListValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("search").optional().isString().withMessage("Search must be a string"),
  query("sortBy").optional().isIn(["shiftName", "startTime", "endTime"]).withMessage("Invalid sortBy field"),
  query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("sortOrder must be asc or desc"),
];
