import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

// Helper function for error responses
const errorResponse = (res, statusCode, message) => {
	return res.status(statusCode).json({ success: false, message });
};

// @desc    Get all categories with subcategories
export const getCategories = async (req, res, next) => {
	try {
		const categories = await Category.aggregate([
			{ $match: { isActive: true } },
			{
				$lookup: {
					from: "categories",
					localField: "_id",
					foreignField: "parent",
					as: "subcategories",
					pipeline: [
						{ $match: { isActive: true } },
						{ $sort: { position: 1, name: 1 } },
						{ $project: { name: 1, slug: 1, description: 1, image: 1 } },
					],
				},
			},
			{ $match: { parent: null } }, // Only get parent categories
			{ $sort: { position: 1, name: 1 } },
			{
				$project: {
					name: 1,
					slug: 1,
					description: 1,
					image: 1,
					subcategories: 1,
				},
			},
		]);

		//@create pagination logic
		if (!categories || categories.length === 0) {
			return errorResponse(res, 404, "No active categories found");
		}
		// Return the categories with subcategories

		res.status(200).json({
			success: true,
			data: {
				count: categories.length,
				results: categories,
			},
		});
	} catch (error) {
		next(error);
	}
};

// @desc    Get single category with populated parent and subcategories
export const getCategoryById = async (req, res, next) => {
	try {
		const categoryId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(categoryId)) {
			return errorResponse(res, 400, "Invalid category ID");
		}

		// First, fetch the category along with subcategories and parent
		const categoryResult = await Category.aggregate([
			{ $match: { _id: new mongoose.Types.ObjectId(categoryId) } },
			{
				$lookup: {
					from: "categories",
					localField: "_id",
					foreignField: "parent",
					as: "subcategories",
					pipeline: [
						{ $match: { isActive: true } },
						{ $sort: { position: 1, name: 1 } },
						{
							$project: {
								_id: 1,
								name: 1,
								slug: 1,
								description: 1,
								image: 1,
								isActive: 1,
								position: 1,
							},
						},
					],
				},
			},
			{
				$lookup: {
					from: "categories",
					localField: "parent",
					foreignField: "_id",
					as: "parent",
					pipeline: [{ $project: { name: 1, slug: 1 } }],
				},
			},
			{ $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },
			{ $limit: 1 },
		]);

		if (!categoryResult || categoryResult.length === 0) {
			return errorResponse(res, 404, "Category not found");
		}

		const category = categoryResult[0];

		// Collect category IDs (main + subcategories)
		const categoryIds = [
			category._id,
			...(category.subcategories || []).map((sub) => sub._id),
		];

		// Fetch products belonging to this category or its subcategories
		const products = await Product.find({
			category: { $in: categoryIds },
			isActive: true,
		}).select("name slug price image description"); // Adjust fields as needed

		res.status(200).json({
			success: true,
			results: {
				...category,
				products,
			},
		});
	} catch (error) {
		next(error);
	}
};
// @desc    Create new category
export const createCategory = async (req, res, next) => {
	try {
		const { name, parent } = req.body;

		// Validate required fields
		if (!name) {
			return errorResponse(res, 400, "Category name is required");
		}

		// Validate parent category exists if provided
		if (parent) {
			if (!mongoose.Types.ObjectId.isValid(parent)) {
				return errorResponse(res, 400, "Invalid parent category ID");
			}

			const parentExists = await Category.exists({ _id: parent });
			if (!parentExists) {
				return errorResponse(res, 400, "Parent category not found");
			}
		}

		const category = await Category.create(req.body);

		res.status(201).json({
			success: true,
			message: "Category created successfully",
			data: category,
		});
	} catch (error) {
		if (error.code === 11000) {
			return errorResponse(
				res,
				400,
				"Category with this name or slug already exists"
			);
		}
		next(error);
	}
};

// @desc    Update category
export const updateCategory = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { parent } = req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return errorResponse(res, 400, "Invalid category ID");
		}

		// Validate parent category exists if provided
		if (parent) {
			if (!mongoose.Types.ObjectId.isValid(parent)) {
				return errorResponse(res, 400, "Invalid parent category ID");
			}

			if (id === parent) {
				return errorResponse(res, 400, "Category cannot be its own parent");
			}

			const parentExists = await Category.exists({ _id: parent });
			if (!parentExists) {
				return errorResponse(res, 400, "Parent category not found");
			}
		}

		const category = await Category.findByIdAndUpdate(id, req.body, {
			new: true,
			runValidators: true,
		});

		if (!category) {
			return errorResponse(res, 404, "Category not found");
		}

		res.status(200).json({
			success: true,
			message: "Category updated successfully",
			data: category,
		});
	} catch (error) {
		if (error.code === 11000) {
			return errorResponse(
				res,
				400,
				"Category with this name or slug already exists"
			);
		}
		next(error);
	}
};

// @desc    Delete category (soft delete)
export const deleteCategory = async (req, res, next) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return errorResponse(res, 400, "Invalid category ID");
		}

		// Check if category has subcategories
		const hasSubcategories = await Category.exists({
			parent: id,
			isActive: true,
		});
		if (hasSubcategories) {
			return errorResponse(
				res,
				400,
				"Cannot delete category with active subcategories"
			);
		}

		// Soft delete by setting isActive to false
		const category = await Category.findByIdAndUpdate(
			id,
			{ isActive: false },
			{ new: true }
		);

		if (!category) {
			return errorResponse(res, 404, "Category not found");
		}

		res.status(200).json({
			success: true,
			message: "Category deleted successfully",
			data: category,
		});
	} catch (error) {
		next(error);
	}
};
