import { Router } from "express";
import { triggerExpiryJobs } from "./cron.controller";
import { validateCronSecret } from "../../middlewares/cron.middleware";

const router = Router();

// Endpoint for cron-job.org to ping
router.get("/expiry", validateCronSecret, triggerExpiryJobs);

export default router;
