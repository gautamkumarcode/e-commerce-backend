import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE || "30d",
	});
};

export const sendOtp = async (req, res, next) => {
	try {
		const { name, email, phone, password } = req.body;

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "User already exists with this email",
			});
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		// Temporarily store user data with OTP (not saving password yet)
		const user = await User.create({
			name,
			email,
			phone,
			password,
			otpCode: otp,
			otpExpires,
			isVerified: false,
		});

		// Simulate sending OTP (log to console or integrate with email/SMS API)
		console.log(`OTP for ${email}: ${otp}`);

		res.status(200).json({
			success: true,
			message: "OTP sent successfully",
			email,
		});
	} catch (error) {
		next(error);
	}
};

export const verifyOtp = async (req, res, next) => {
	try {
		const { email, otp } = req.body;

		const user = await User.findOne({ email });

		if (!user || !user.otpCode || user.otpExpires < Date.now()) {
			return res.status(400).json({
				success: false,
				message: "OTP is invalid or expired",
			});
		}

		if (user.otpCode !== otp) {
			return res.status(400).json({
				success: false,
				message: "Invalid OTP",
			});
		}

		user.isVerified = true;
		user.otpCode = undefined;
		user.otpExpires = undefined;
		await user.save();

		const token = generateToken(user._id);

		res.status(200).json({
			success: true,
			message: "OTP verified, registration successful",
			token,
			user,
		});
	} catch (error) {
		next(error);
	}
};

export const login = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email }).select("+password");
		if (!user || !(await user.comparePassword(password))) {
			return res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		user.lastLogin = new Date();
		await user.save();

		const token = generateToken(user._id);

		res.status(200).json({
			success: true,
			message: "Login successful",
			token,
			user,
		});
	} catch (error) {
		next(error);
	}
};

export const getMe = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id);
		res.status(200).json({
			success: true,
			user,
		});
	} catch (error) {
		next(error);
	}
};

export const logout = (req, res) => {
	res.status(200).json({
		success: true,
		message: "User logged out successfully",
	});
};

export const forgotPassword = async (req, res, next) => {
	try {
		const user = await User.findOne({ email: req.body.email });
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "There is no user with that email",
			});
		}

		const resetToken = crypto.randomBytes(20).toString("hex");
		user.passwordResetToken = crypto
			.createHash("sha256")
			.update(resetToken)
			.digest("hex");
		user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

		await user.save({ validateBeforeSave: false });

		res.status(200).json({
			success: true,
			message: "Password reset token generated",
			resetToken, // in production: send via email
		});
	} catch (error) {
		next(error);
	}
};
export const resetPassword = async (req, res, next) => {
	try {
		const resetToken = crypto
			.createHash("sha256")
			.update(req.body.resetToken)
			.digest("hex");
		const user = await User.findOne({
			passwordResetToken: resetToken,
			passwordResetExpires: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired reset token",
			});
		}

		user.password = req.body.password;
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;

		await user.save();

		res.status(200).json({
			success: true,
			message: "Password has been reset successfully",
		});
	} catch (error) {
		next(error);
	}
};
export const updateProfile = async (req, res, next) => {
	try {
		const user = await User.findByIdAndUpdate(
			req.user.id,
			{ name: req.body.name, email: req.body.email },
			{ new: true, runValidators: true }
		);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			user,
		});
	} catch (error) {
		next(error);
	}
};
export const changePassword = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id).select("+password");
		if (!user || !(await user.comparePassword(req.body.currentPassword))) {
			return res.status(401).json({
				success: false,
				message: "Current password is incorrect",
			});
		}

		user.password = req.body.newPassword;
		await user.save();

		res.status(200).json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (error) {
		next(error);
	}
};
export const getAllUsers = async (req, res, next) => {
	try {
		const users = await User.find().select("-password");
		res.status(200).json({
			success: true,
			data: users,
		});
	} catch (error) {
		next(error);
	}
};
export const getUserById = async (req, res, next) => {
	try {
		const user = await User.findById(req.params.id).select("-password");
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}
		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (error) {
		next(error);
	}
};
export const updateUser = async (req, res, next) => {
	try {
		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ name: req.body.name, email: req.body.email, role: req.body.role },
			{ new: true, runValidators: true }
		);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}
		res.status(200).json({
			success: true,
			message: "User updated successfully",
			data: user,
		});
	} catch (error) {
		next(error);
	}
};
export const deleteUser = async (req, res, next) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		await user.deleteOne();

		res.status(200).json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (error) {
		next(error);
	}
};
export const deactivateUser = async (req, res, next) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		user.isActive = false;
		await user.save();

		res.status(200).json({
			success: true,
			message: "User account deactivated successfully",
		});
	} catch (error) {
		next(error);
	}
};
export const activateUser = async (req, res, next) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		user.isActive = true;
		await user.save();

		res.status(200).json({
			success: true,
			message: "User account activated successfully",
		});
	} catch (error) {
		next(error);
	}
};
export const updateLastLogin = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		user.lastLogin = new Date();
		await user.save();

		res.status(200).json({
			success: true,
			message: "Last login updated successfully",
			user,
		});
	} catch (error) {
		next(error);
	}
};
