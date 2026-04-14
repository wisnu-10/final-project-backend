import { Router } from "express";
import { jwtVerify, roleverify } from "../../middlewares/auth.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";
import { orderCustomerController } from "./order-customer.controller";
import { createOrderValidator } from "./validator/create-order.validator";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";

const router = Router();

router.post(
  "/create-pickup",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  createOrderValidator,
  expressRequestValidation,
  orderCustomerController.createOrderPickup,
);

router.get(
  "/",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  orderCustomerController.getAllOrder,
);

router.get(
  "/:id",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  orderCustomerController.getById,
);

export default router;
