import Product from "../models/Product.js";

// @desc Get all products
export const getAllProducts = async (req, res, next) => {
	try {
		const page = Number.parseInt(req.query.page) || 1;
		const limit = Number.parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const query = { isActive: true };

		if (req.query.search) {
			query.$text = { $search: req.query.search };
		}

		if (req.query.category) {
			query.category = req.query.category;
		}

		if (req.query.minPrice || req.query.maxPrice) {
			query.price = {};
			if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
			if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
		}

		let sortBy = {};
		if (req.query.sortBy) {
			const [key, order] = req.query.sortBy.split(":");
			sortBy[key] = order === "desc" ? -1 : 1;
		} else {
			sortBy = { createdAt: -1 };
		}

		const products = await Product.find(query)
			.populate("category", "name slug")
			.sort(sortBy)
			.skip(skip)
			.limit(limit);

		const total = await Product.countDocuments(query);

		res.status(200).json({
			success: true,
			count: products.length,
			total,
			page,
			pages: Math.ceil(total / limit),
			data: products,
		});
	} catch (error) {
		next(error);
	}
};

// @desc Get single product
export const getProductById = async (req, res, next) => {
	try {
		const product = await Product.findById(req.params.id).populate(
			"category",
			"name slug"
		);

		if (!product) {
			return res
				.status(404)
				.json({ success: false, message: "Product not found" });
		}

		res.status(200).json({ success: true, data: product });
	} catch (error) {
		next(error);
	}
};

// @desc Create new product
export const createProduct = async (req, res, next) => {
	try {
		const product = await Product.create(req.body);

		res.status(201).json({
			success: true,
			message: "Product created successfully",
			data: product,
		});
	} catch (error) {
		next(error);
	}
};

// @desc Update product
export const updateProduct = async (req, res, next) => {
	try {
		const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});

		if (!product) {
			return res
				.status(404)
				.json({ success: false, message: "Product not found" });
		}

		res.status(200).json({
			success: true,
			message: "Product updated successfully",
			data: product,
		});
	} catch (error) {
		next(error);
	}
};

// @desc Delete product
export const deleteProduct = async (req, res, next) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res
				.status(404)
				.json({ success: false, message: "Product not found" });
		}

		await product.deleteOne();

		res.status(200).json({
			success: true,
			message: "Product deleted successfully",
		});
	} catch (error) {
		next(error);
	}
};

// @desc Get featured products
export const getFeaturedProducts = async (req, res, next) => {
	try {
		const products = await Product.find({ isActive: true, isFeatured: true })
			.populate("category", "name slug")
			.limit(8)
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: products.length,
			data: products,
		});
	} catch (error) {
		next(error);
	}
};
