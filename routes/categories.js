import express from "express";

import {
	createCategory,
	deleteCategory,
	getCategories,
	getCategoryById,
	updateCategory,
} from "../controller/category-controller.js";
import { authorize, protect } from "../middleware/auth.js";
import {
	categorySchema,
	validateRequest,
} from "../middleware/validationSchema/validation.js";

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post(
	"/",
	protect,
	authorize("admin"),
	validateRequest(categorySchema),
	createCategory
);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

export default router;
