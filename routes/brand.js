import express from "express";
import {
	getAllBrands,
	getBrandWithCategories,
} from "../controller/brand-controller.js";

const BrandRouter = express.Router();

// @route   GET /api/brands/:brandId
BrandRouter.get("/:brandId", getBrandWithCategories);

// @route   GET /api/brands
BrandRouter.get("/", getAllBrands);

export default BrandRouter;
