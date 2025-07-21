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
		console.log(categories);

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
