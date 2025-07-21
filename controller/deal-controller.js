// controllers/dealController.js

import mongoose from "mongoose";
import Deal from "../models/Deal.js";

// @desc    Create a new deal
export const createDeal = async (req, res) => {
	try {
		const deal = await Deal.create(req.body);
		res.status(201).json({
			success: true,
			data: deal,
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get all active deals
export const getActiveDeals = async (req, res) => {
	try {
		const now = new Date();
		const deals = await Deal.find({
			isActive: true,
			startDate: { $lte: now },
			endDate: { $gte: now },
		})
			.sort({ position: 1 })
			.populate("products categories brands");

		res.status(200).json({
			success: true,
			count: deals.length,
			data: deals,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get deals by type (seasonal, flash, etc.)
export const getDealsByType = async (req, res) => {
	try {
		const { type } = req.params;
		const now = new Date();

		const deals = await Deal.find({
			dealType: type,
			isActive: true,
			startDate: { $lte: now },
			endDate: { $gte: now },
		}).sort({ position: 1 });

		res.status(200).json({
			success: true,
			count: deals.length,
			data: deals,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc  add products to a deal
export const addProductsToDeal = async (req, res) => {
	try {
		const { dealId, productIds } = req.body;

		const deal = await Deal.findById(dealId);
		if (!deal) {
			return res.status(404).json({
				success: false,
				message: "Deal not found",
			});
		}

		// Convert productIds to ObjectId
		const objectIds = productIds.map((id) => new mongoose.Types.ObjectId(id));

		// Add products to the deal (avoiding duplicates)
		deal.products.push(...objectIds);
		await deal.save();

		res.status(200).json({
			success: true,
			data: deal,
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};
