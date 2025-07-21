import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
			maxlength: [50, "Name cannot exceed 50 characters"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				"Please enter a valid email",
			],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters"],
			select: false,
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		avatar: {
			type: String,
			default: "",
		},
		phone: {
			type: String,
			match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
		},
		address: {
			type: new mongoose.Schema(
				{
					street: { type: String, default: "" },
					city: { type: String, default: "" },
					state: { type: String, default: "" },
					zipCode: { type: String, default: "" },
					country: { type: String, default: "" },
				},
				{ _id: false } // Prevents creating a separate _id for the address subdocument
			),
			default: {},
		},

		isEmailVerified: {
			type: Boolean,
			default: false,
		},
		emailVerificationToken: String,
		passwordResetToken: String,
		passwordResetExpires: Date,
		lastLogin: Date,
		isActive: {
			type: Boolean,
			default: true,
		},
		otpCode: { type: String },
		otpExpires: { type: Date },
		isVerified: { type: Boolean, default: false },
	},

	{
		timestamps: true,
	}
);

// Hash password before saving
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		const salt = await bcrypt.genSalt(12);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
	const userObject = this.toObject();
	delete userObject.password;
	delete userObject.emailVerificationToken;
	delete userObject.passwordResetToken;
	delete userObject.passwordResetExpires;
	return userObject;
};

export default mongoose.model("User", userSchema);
