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
			data: {
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

// @desc   get all the brands
export const getAllBrands = async (req, res, next) => {
	try {
		const brands = await Brand.find({ isActive: true }).sort({ name: 1 });

		res.status(200).json({
			success: true,
			count: brands.length,
			data: brands,
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
