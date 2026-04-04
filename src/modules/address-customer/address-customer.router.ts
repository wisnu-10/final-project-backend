import { Router } from "express";
import { jwtCreateToken } from "../../helpers/jwt.helper";
import { JWT_TOKEN_SECRET_KEY } from "../../config/main.config";
import { jwtVerify, roleverify } from "../../middlewares/auth.middleware";
import { addressCustomerController } from "./address-customer.controller";
import { addressValidator } from "./validators/address.validatior";
import { expressRequestValidation } from "../../middlewares/express-request-validation.middleware";

const router = Router();

router.post(
  "/create",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  addressValidator,
  expressRequestValidation,
  addressCustomerController.createAddress,
);
router.put(
  "/update/:id",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  addressValidator,
  expressRequestValidation,
  addressCustomerController.updateAddress,
);
router.get(
  "/me",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  addressCustomerController.getAddresses,
);
router.patch(
  "/delete/:id",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  addressCustomerController.deleteAddress,
);
router.get(
  "/get/:addressId",
  jwtVerify(JWT_TOKEN_SECRET_KEY!),
  roleverify(["customer"]),
  addressCustomerController.getById,
);

export default router;
