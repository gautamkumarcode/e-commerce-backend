import express from "express";

import {
	addItemToCart,
	clearCart,
	getUserCart,
	removeCartItem,
	updateCartItem,
} from "../controller/cart-controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getUserCart);
router.post("/items", protect, addItemToCart);
router.put("/items/:productId", protect, updateCartItem);
router.delete("/items/:productId", protect, removeCartItem);
router.delete("/", protect, clearCart);

export default router;
