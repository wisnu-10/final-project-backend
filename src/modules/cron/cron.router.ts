import { Router } from "express";
import { triggerExpiryJobs } from "./cron.controller";
import { validateCronSecret } from "../../middlewares/cron.middleware";

const router = Router();

// Endpoint for cron-job.org to ping
router.post("/expiry", validateCronSecret, triggerExpiryJobs);

export default router;
