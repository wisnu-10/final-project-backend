import { Request, Response } from "express";
import { expiryScheduleOrderJob } from "../../helpers/jobs/expiry/expiry-schedule-order";
import { expiryScheduleConfirmOrderJob } from "../../helpers/jobs/expiry/expiry-schedule-confirm-order";

export const triggerExpiryJobs = async (req: Request, res: Response) => {
  try {
    console.log(`[CRON]: Triggering expiry jobs via external request...`);
    
    // Execute jobs in parallel or sequence
    await Promise.all([
      expiryScheduleOrderJob(),
      expiryScheduleConfirmOrderJob()
    ]);

    console.log(`[CRON]: Expiry jobs executed successfully.`);
    res.status(200).json({ 
      success: true, 
      message: "Expiry jobs executed successfully" 
    });
  } catch (error: any) {
    console.error(`[CRON]: Error executing expiry jobs:`, error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error during job execution",
      error: error.message 
    });
  }
};
