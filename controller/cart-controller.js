import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const getUserCart = async (req, res, next) => {
	try {
		let cart = await Cart.findOne({ user: req.user.id }).populate(
			"items.product",
			"name price images inventory.quantity"
		);

		if (!cart) {
			cart = await Cart.create({ user: req.user.id, items: [] });
		}

		res.status(200).json({ success: true, data: cart });
	} catch (error) {
		next(error);
	}
};

export const addItemToCart = async (req, res, next) => {
	try {
		const { productId, quantity = 1 } = req.body;

		const product = await Product.findById(productId);
		if (!product) {
			return res
				.status(404)
				.json({ success: false, message: "Product not found" });
		}

		if (
			product.inventory.trackQuantity &&
			product.inventory.quantity < quantity
		) {
			return res
				.status(400)
				.json({ success: false, message: "Insufficient inventory" });
		}

		let cart = await Cart.findOne({ user: req.user.id });

		if (!cart) {
			cart = new Cart({ user: req.user.id, items: [] });
		}

		const existingItemIndex = cart.items.findIndex(
			(item) => item.product.toString() === productId
		);

		if (existingItemIndex > -1) {
			cart.items[existingItemIndex].quantity += quantity;
		} else {
			cart.items.push({ product: productId, quantity, price: product.price });
		}

		await cart.save();
		await cart.populate(
			"items.product",
			"name price images inventory.quantity"
		);

		res
			.status(200)
			.json({ success: true, message: "Item added to cart", data: cart });
	} catch (error) {
		next(error);
	}
};

export const updateCartItem = async (req, res, next) => {
	try {
		const { quantity } = req.body;
		const { productId } = req.params;

		if (quantity <= 0) {
			return res.status(400).json({
				success: false,
				message: "Quantity must be greater than 0",
			});
		}

		const cart = await Cart.findOne({ user: req.user.id });
		if (!cart) {
			return res
				.status(404)
				.json({ success: false, message: "Cart not found" });
		}

		const itemIndex = cart.items.findIndex(
			(item) => item.product.toString() === productId
		);

		if (itemIndex === -1) {
			return res
				.status(404)
				.json({ success: false, message: "Item not found in cart" });
		}

		cart.items[itemIndex].quantity = quantity;
		await cart.save();
		await cart.populate(
			"items.product",
			"name price images inventory.quantity"
		);

		res
			.status(200)
			.json({ success: true, message: "Cart updated", data: cart });
	} catch (error) {
		next(error);
	}
};

export const removeCartItem = async (req, res, next) => {
	try {
		const { productId } = req.params;

		const cart = await Cart.findOne({ user: req.user.id });
		if (!cart) {
			return res
				.status(404)
				.json({ success: false, message: "Cart not found" });
		}

		cart.items = cart.items.filter(
			(item) => item.product.toString() !== productId
		);

		await cart.save();
		await cart.populate(
			"items.product",
			"name price images inventory.quantity"
		);

		res
			.status(200)
			.json({ success: true, message: "Item removed from cart", data: cart });
	} catch (error) {
		next(error);
	}
};

export const clearCart = async (req, res, next) => {
	try {
		const cart = await Cart.findOne({ user: req.user.id });
		if (!cart) {
			return res
				.status(404)
				.json({ success: false, message: "Cart not found" });
		}

		cart.items = [];
		await cart.save();

		res
			.status(200)
			.json({ success: true, message: "Cart cleared", data: cart });
	} catch (error) {
		next(error);
	}
};
