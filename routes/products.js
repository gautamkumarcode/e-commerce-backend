import express from "express";
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getFeaturedProducts,
	getProductById,
	updateProduct,
} from "../controller/product-controller.js";
import { authorize, protect } from "../middleware/auth.js";
import {
	productSchema,
	validateRequest,
} from "../middleware/validationSchema/validation.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/featured/list", getFeaturedProducts);
router.get("/:id", getProductById);

router.post(
	"/",
	protect,
	authorize("admin"),
	validateRequest(productSchema),
	createProduct
);
router.put("/:id", protect, authorize("admin"), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;
