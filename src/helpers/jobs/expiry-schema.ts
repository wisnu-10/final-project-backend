import cron from "node-cron";
import { expiryScheduleOrderJob } from "./expiry/expiry-schedule-order";
import { expiryScheduleConfirmOrderJob } from "./expiry/expiry-schedule-confirm-order";

export function expirySchedule() {
  cron.schedule("*/1 * * * *", async () => {
    console.log(`[CRON]: running expiry job`);
    await expiryScheduleOrderJob();
    await expiryScheduleConfirmOrderJob();
  });
}
