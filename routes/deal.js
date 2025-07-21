import express from "express";
import {
	addProductsToDeal,
	createDeal,
	getActiveDeals,
	getDealsByType,
} from "../controller/deal-controller.js";

const router = express.Router();

router.get("/", getActiveDeals);
router.get("/:type", getDealsByType);
router.post("/create", createDeal);
router.post("/add-products", addProductsToDeal);

export default router;
