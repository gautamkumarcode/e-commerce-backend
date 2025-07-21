import express from "express";
import { protect } from "../middleware/auth.js";
import {
	reviewSchema,
	validateRequest,
} from "../middleware/validationSchema/validation.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";

const router = express.Router();

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
router.get("/product/:productId", async (req, res, next) => {
	try {
		const page = Number.parseInt(req.query.page) || 1;
		const limit = Number.parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const reviews = await Review.find({
			product: req.params.productId,
			isApproved: true,
		})
			.populate("user", "name")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await Review.countDocuments({
			product: req.params.productId,
			isApproved: true,
		});

		res.status(200).json({
			success: true,
			count: reviews.length,
			total,
			page,
			pages: Math.ceil(total / limit),
			data: reviews,
		});
	} catch (error) {
		next(error);
	}
});

// @desc    Create new review
// @route   POST /api/reviews/product/:productId
// @access  Private
router.post(
	"/product/:productId",
	protect,
	validateRequest(reviewSchema),
	async (req, res, next) => {
		try {
			const { rating, title, comment } = req.body;
			const productId = req.params.productId;

			// Check if product exists
			const product = await Product.findById(productId);
			if (!product) {
				return res.status(404).json({
					success: false,
					message: "Product not found",
				});
			}

			// Check if user already reviewed this product
			const existingReview = await Review.findOne({
				user: req.user.id,
				product: productId,
			});

			if (existingReview) {
				return res.status(400).json({
					success: false,
					message: "You have already reviewed this product",
				});
			}

			// Check if user purchased this product
			const userOrder = await Order.findOne({
				user: req.user.id,
				"orderItems.product": productId,
				isPaid: true,
			});

			const review = await Review.create({
				user: req.user.id,
				product: productId,
				rating,
				title,
				comment,
				isVerifiedPurchase: !!userOrder,
			});

			// Update product rating
			await updateProductRating(productId);

			const populatedReview = await Review.findById(review._id).populate(
				"user",
				"name"
			);

			res.status(201).json({
				success: true,
				message: "Review created successfully",
				data: populatedReview,
			});
		} catch (error) {
			next(error);
		}
	}
);

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
router.put("/:id", protect, async (req, res, next) => {
	try {
		const review = await Review.findById(req.params.id);

		if (!review) {
			return res.status(404).json({
				success: false,
				message: "Review not found",
			});
		}

		// Check if user owns this review
		if (review.user.toString() !== req.user.id) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this review",
			});
		}

		const { rating, title, comment } = req.body;

		review.rating = rating || review.rating;
		review.title = title || review.title;
		review.comment = comment || review.comment;

		const updatedReview = await review.save();

		// Update product rating
		await updateProductRating(review.product);

		res.status(200).json({
			success: true,
			message: "Review updated successfully",
			data: updatedReview,
		});
	} catch (error) {
		next(error);
	}
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete("/:id", protect, async (req, res, next) => {
	try {
		const review = await Review.findById(req.params.id);

		if (!review) {
			return res.status(404).json({
				success: false,
				message: "Review not found",
			});
		}

		// Check if user owns this review or is admin
		if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this review",
			});
		}

		const productId = review.product;
		await review.deleteOne();

		// Update product rating
		await updateProductRating(productId);

		res.status(200).json({
			success: true,
			message: "Review deleted successfully",
		});
	} catch (error) {
		next(error);
	}
});

// Helper function to update product rating
async function updateProductRating(productId) {
	const reviews = await Review.find({ product: productId, isApproved: true });

	if (reviews.length > 0) {
		const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
		const averageRating = totalRating / reviews.length;

		await Product.findByIdAndUpdate(productId, {
			averageRating: Math.round(averageRating * 10) / 10,
			numReviews: reviews.length,
		});
	} else {
		await Product.findByIdAndUpdate(productId, {
			averageRating: 0,
			numReviews: 0,
		});
	}
}

export default router;
