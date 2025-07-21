import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Product name is required"],
			trim: true,
			maxlength: [100, "Product name cannot exceed 100 characters"],
		},
		description: {
			type: String,
			required: [true, "Product description is required"],
			maxlength: [2000, "Description cannot exceed 2000 characters"],
		},
		price: {
			type: Number,
			required: [true, "Product price is required"],
			min: [0, "Price cannot be negative"],
		},
		comparePrice: {
			type: Number,
			min: [0, "Compare price cannot be negative"],
		},
		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
			required: [true, "Product category is required"],
		},
		brand: {
			type: String,
			trim: true,
		},
		sku: {
			type: String,
			unique: true,
			required: [true, "SKU is required"],
		},
		images: [
			{
				url: {
					type: String,
					required: true,
				},
				alt: String,
				isMain: {
					type: Boolean,
					default: false,
				},
			},
		],
		inventory: {
			quantity: {
				type: Number,
				required: [true, "Inventory quantity is required"],
				min: [0, "Quantity cannot be negative"],
			},
			lowStockThreshold: {
				type: Number,
				default: 10,
			},
			trackQuantity: {
				type: Boolean,
				default: true,
			},
		},
		specifications: [
			{
				name: String,
				value: String,
			},
		],
		tags: [String],
		weight: {
			type: Number,
			min: [0, "Weight cannot be negative"],
		},
		dimensions: {
			length: Number,
			width: Number,
			height: Number,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isFeatured: {
			type: Boolean,
			default: false,
		},
		averageRating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		numReviews: {
			type: Number,
			default: 0,
		},
		seoTitle: String,
		seoDescription: String,
		slug: {
			type: String,
			required: false,
		},
	},
	{
		timestamps: true,
	}
);

// Create slug from name
productSchema.pre("save", function (next) {
	if (this.isModified("name")) {
		this.slug = this.name
			.toLowerCase()
			.replace(/[^a-zA-Z0-9]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
	}
	next();
});

// Index for search
// productSchema.index({ name: "text", description: "text", tags: "text" });
// productSchema.index({ category: 1, isActive: 1 });
// productSchema.index({ price: 1 });
// productSchema.index({ createdAt: -1 });

export default mongoose.model("Product", productSchema);
