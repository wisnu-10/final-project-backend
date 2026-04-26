import { Router } from "express";
import { paymentCustomerController } from "./payment-customer.controller";
import { jwtVerify, roleverify } from "../../middlewares/auth.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";

const router = Router();

router.post(
  "/create",
  /* jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]), */
  paymentCustomerController.createPayment,
);

router.post("/webhook", paymentCustomerController.handleWebhook);

router.post("/email-invoice/:orderId", paymentCustomerController.emailInvoice)

export default router