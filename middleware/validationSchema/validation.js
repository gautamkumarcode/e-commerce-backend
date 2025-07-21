import Joi from "joi";

export const validateRequest = (schema) => {
	return (req, res, next) => {
		const { error } = schema.validate(req.body);

		if (error) {
			const errorMessage = error.details
				.map((detail) => detail.message)
				.join(", ");
			return res.status(400).json({
				success: false,
				message: "Validation error",
				errors: errorMessage,
			});
		}

		next();
	};
};

// Validation schemas
export const registerSchema = Joi.object({
	name: Joi.string().min(2).max(50).required(),
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
	phone: Joi.string()
		.pattern(/^\+?[\d\s-()]+$/)
		.optional(),
});
export const verifyOtpSchema = Joi.object({
	email: Joi.string().email().required(),
	otp: Joi.number().required(),
});
export const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

export const productSchema = Joi.object({
	name: Joi.string().min(2).max(100).required(),
	description: Joi.string().max(2000).required(),
	price: Joi.number().min(0).required(),
	comparePrice: Joi.number().min(0).optional(),
	category: Joi.string().required(),
	brand: Joi.string().optional(),
	sku: Joi.string().required(),
	inventory: Joi.object({
		quantity: Joi.number().min(0).required(),
		lowStockThreshold: Joi.number().min(0).optional(),
		trackQuantity: Joi.boolean().optional(),
	}).required(),
	specifications: Joi.array()
		.items(
			Joi.object({
				name: Joi.string().required(),
				value: Joi.string().required(),
			})
		)
		.optional(),
	tags: Joi.array().items(Joi.string()).optional(),
	weight: Joi.number().min(0).optional(),
	dimensions: Joi.object({
		length: Joi.number().min(0).optional(),
		width: Joi.number().min(0).optional(),
		height: Joi.number().min(0).optional(),
	}).optional(),
});

export const categorySchema = Joi.object({
	name: Joi.string().min(2).max(50).required(),
	description: Joi.string().max(500).optional(),
	parent: Joi.string().optional(),
	sortOrder: Joi.number().optional(),
});

export const reviewSchema = Joi.object({
	rating: Joi.number().min(1).max(5).required(),
	title: Joi.string().max(100).required(),
	comment: Joi.string().max(1000).required(),
});
