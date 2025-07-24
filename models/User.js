import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
	{
		area: { type: String },

		street: { type: String },
		city: { type: String },
		state: { type: String },
		zipCode: { type: String },
		country: { type: String },
	},
	{ _id: false }
);

const userSchema = new mongoose.Schema(
	{
		firstname: {
			type: String,
			required: [true, "First name is required"],
			trim: true,
			maxlength: [50, "Name cannot exceed 50 characters"],
		},
		lastname: {
			type: String,
			required: [true, "Last name is required"],
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
		},
		phone: {
			type: String,
			match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
		},
		address: {
			type: [addressSchema],
			default: [],
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
		otpCode: String,
		otpExpires: Date,
		isVerified: {
			type: Boolean,
			default: false,
		},
		age: {
			type: Number,
			min: [0, "Age cannot be negative"],
			max: [120, "Age cannot exceed 120"],
		},
		occupation: {
			type: String,
			required: [true, "Occupation is required"],
			trim: true,
			maxlength: [100, "Occupation cannot exceed 100 characters"],
		},
		gender: {
			type: String,
			enum: ["male", "female", "other"],
		},
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
	if (!this.password) return false;
	return await bcrypt.compare(candidatePassword, this.password);
};

// Hide sensitive fields from output
userSchema.methods.toJSON = function () {
	const obj = this.toObject();
	delete obj.password;
	delete obj.emailVerificationToken;
	delete obj.passwordResetToken;
	delete obj.passwordResetExpires;
	delete obj.otpCode;
	delete obj.otpExpires;
	return obj;
};

export default mongoose.models.User || mongoose.model("User", userSchema);
