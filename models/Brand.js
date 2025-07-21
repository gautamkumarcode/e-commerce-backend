import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Brand name is required"],
			trim: true,
			unique: true,
			maxlength: [50, "Brand name cannot exceed 50 characters"],
		},
		slug: {
			type: String,
			unique: true,
			lowercase: true,
			index: true,
		},
		description: {
			type: String,
			trim: true,
			maxlength: [500, "Description cannot exceed 500 characters"],
		},
		logo: {
			type: String, // URL to the logo image
			required: [true, "Brand logo is required"],
		},
		website: {
			type: String,
			match: [
				/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
				"Please enter a valid website URL",
			],
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		featured: {
			type: Boolean,
			default: false,
		},
		metaTitle: {
			type: String,
			trim: true,
			maxlength: [60, "Meta title cannot exceed 60 characters"],
		},
		metaDescription: {
			type: String,
			trim: true,
			maxlength: [160, "Meta description cannot exceed 160 characters"],
		},
		position: {
			type: Number,
			default: 0,
		},
		seoKeywords: [String],
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Create slug from name before saving
brandSchema.pre("save", function (next) {
	if (this.isModified("name")) {
		this.slug = this.name
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
	}
	next();
});

// Virtual for product count
brandSchema.virtual("productCount", {
	ref: "Product",
	localField: "_id",
	foreignField: "brand",
	count: true,
});

// Indexes for better performance
brandSchema.index({ name: 1 });
brandSchema.index({ slug: 1 });
brandSchema.index({ isActive: 1, position: 1 });

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
