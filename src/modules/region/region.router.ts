import { Router } from "express";
import { regionController } from "./region.controller";

const router = Router();

router.get("/provinces", regionController.getProvinces);
router.get("/cities/:provinceId", regionController.getCitiesByProvince);
router.get("/districts/:cityId", regionController.getDistrictsByCity);

export default router;
