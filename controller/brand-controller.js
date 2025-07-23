// @desc    Get brand with all associated categories

import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import Product from "../models/Product.js";

// @route   GET /api/brands/:brandId/categories
export const getBrandWithCategories = async (req, res, next) => {
	try {
		const { brandId } = req.params;

		// 1. Get the brand first
		const brand = await Brand.findById(brandId).lean();
		if (!brand) {
			return res.status(404).json({
				success: false,
				message: "Brand not found",
			});
		}

		const categories = await Product.aggregate([
			{
				$match: {
					brand: new mongoose.Types.ObjectId(brand._id),
					category: { $ne: null }, // only products with a category
				},
			},
			{
				$group: {
					_id: "$category",
				},
			},
			{
				$lookup: {
					from: "categories",
					localField: "_id",
					foreignField: "_id",
					as: "categoryDetails",
				},
			},
			{ $unwind: "$categoryDetails" },
			{ $match: { "categoryDetails.isActive": true } },
			{ $sort: { "categoryDetails.position": 1 } },
			{
				$project: {
					_id: "$categoryDetails._id",
					name: "$categoryDetails.name",
					slug: "$categoryDetails.slug",
					image: "$categoryDetails.image",
					description: "$categoryDetails.description",
				},
			},
		]);

		// 3. Return combined response
		res.status(200).json({
			success: true,
			results: {
				brand: {
					_id: brand._id,
					name: brand.name,
					logo: brand.logo,
					website: brand.website,
				},
				categories,
				categoryCount: categories.length,
			},
		});
	} catch (error) {
		next(error);
	}
};

// @desc   get all the brands and search by name
// @route  GET /api/brands/search
export const getAllBrands = async (req, res, next) => {
	try {
		const { search } = req.query;

		const page = Number.parseInt(req.query.page) || 1;
		const limit = Number.parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		// Build the filter
		const filter = { isActive: true };
		if (search) {
			filter.name = { $regex: search, $options: "i" };
		}

		// Paginated & filtered query
		const paginatedBrands = await Brand.find(filter)
			.select("-createdAt -updatedAt")
			.sort({ name: 1 })
			.skip(skip)
			.limit(limit);

		const total = await Brand.countDocuments(filter);
		const totalPages = Math.ceil(total / limit);

		if (!paginatedBrands || paginatedBrands.length === 0) {
			return res.status(404).json({
				success: false,
				message: "No active brands found",
			});
		}

		res.status(200).json({
			success: true,
			data: {
				count: paginatedBrands.length,
				totalPages,
				currentPage: page,
				results: paginatedBrands,
			},
		});
	} catch (error) {
		next(error);
	}
};


// @desc    create a new brand
export const createBrand = async (req, res, next) => {
	try {
		const { name, logo, website } = req.body;

		if (!name || !logo) {
			return res.status(400).json({
				success: false,
				message: "Name and logo are required",
			});
		}

		const brand = new Brand({
			name,
			logo,
			website,
		});

		await brand.save();

		res.status(201).json({
			success: true,
			data: brand,
		});
	} catch (error) {
		next(error);
	}
};
// @desc    Update a brand
// @route   PUT /api/brands/:id

export const updateBrand = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { name, logo, website } = req.body;

		const brand = await Brand.findByIdAndUpdate(
			id,
			{ name, logo, website },
			{ new: true, runValidators: true }
		);

		if (!brand) {
			return res.status(404).json({
				success: false,
				message: "Brand not found",
			});
		}

		res.status(200).json({
			success: true,
			data: brand,
		});
	} catch (error) {
		next(error);
	}
};
// @desc    Delete a brand
// @route   DELETE /api/brands/:id
export const deleteBrand = async (req, res, next) => {
	try {
		const { id } = req.params;

		const brand = await Brand.findByIdAndDelete(id);

		if (!brand) {
			return res.status(404).json({
				success: false,
				message: "Brand not found",
			});
		}

		res.status(200).json({
			success: true,
			data: brand,
		});
	} catch (error) {
		next(error);
	}
};
