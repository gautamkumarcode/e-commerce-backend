// models/Deal.js
import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, "Deal title is required"],
			trim: true,
		},
		slug: {
			type: String,
			unique: true,
			lowercase: true,
		},
		description: String,
		bannerImage: {
			type: String,
			required: true,
		},
		dealType: {
			type: String,
			enum: ["seasonal", "flash", "category", "brand"],
			required: true,
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		discountType: {
			type: String,
			enum: ["percentage", "fixed", "combo"],
			required: true,
		},
		discountValue: {
			type: Number,
			required: true,
		},
		products: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Product",
			},
		],
		categories: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Category",
			},
		],
		brands: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Brand",
			},
		],
		maxDiscountAmount: Number,
		minOrderValue: Number,
		position: Number,
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		color: {
			type: String,
			default: "#000000", // Default color if not specified
		},
		originalPrice: Number, // For combo deals
		comboProducts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Product",
			},
		],
	},
	{ timestamps: true }
);

// Create slug from title
dealSchema.pre("save", function (next) {
	if (this.isModified("title")) {
		this.slug = this.title
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
	}
	next();
});

export default mongoose.model("Deal", dealSchema);
