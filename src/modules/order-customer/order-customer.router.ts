import { Router } from "express";
import { jwtVerify, roleverify } from "../../middlewares/auth.middleware";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";
import { orderCustomerController } from "./order-customer.controller";

const router = Router();

router.post("/create-pickup",jwtVerify(JWT_TOKEN_SECRET_KEY!), roleverify(["customer"]), orderCustomerController.createOrderPickup);

export default router;