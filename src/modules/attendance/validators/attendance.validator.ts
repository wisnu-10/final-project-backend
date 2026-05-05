import { query } from "express-validator";

export const attendanceHistoryValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("month").optional().isInt({ min: 1, max: 12 }).withMessage("Month must be between 1 and 12"),
  query("year").optional().isInt({ min: 2000, max: 2099 }).withMessage("Year must be between 2000 and 2099"),
  query("sortBy").optional().isIn(["date", "status", "checkIn", "checkOut"]).withMessage("Invalid sortBy field"),
  query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("sortOrder must be asc or desc"),
];

export const attendanceReportValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("startDate").optional().isISO8601().withMessage("Start date must be a valid date"),
  query("endDate").optional().isISO8601().withMessage("End date must be a valid date"),
  query("status").optional().isIn(["present", "late", "absent"]).withMessage("Status must be present, late, or absent"),
  query("search").optional().isString().withMessage("Search must be a string"),
  query("sortBy").optional().isIn(["firstName", "lastName", "role", "date"]).withMessage("Invalid sortBy field"),
  query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("sortOrder must be asc or desc"),
];
