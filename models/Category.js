import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Category name is required"],
			trim: true,
		},
		slug: {
			type: String,
			unique: true,
			lowercase: true,
		},
		description: {
			type: String,
			trim: true,
		},
		parent: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
			default: null, // null for top-level categories
		},
		image: {
			type: String,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		position: {
			type: Number, // for sorting
			default: 0,
		},
	},
	{ timestamps: true }
);

// Create slug from name
categorySchema.pre("save", function (next) {
	if (this.isModified("name")) {
		this.slug = this.name
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
	}
	next();
});

export default mongoose.model("Category", categorySchema);
