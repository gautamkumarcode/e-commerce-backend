import crypto from "crypto";
import User from "../models/User.js";
import { generateToken } from "../services/token.js";

export const sendOtpToPhone = async (req, res, next) => {
	try {
		const { phone } = req.body;
		console.log(phone);

		if (!phone) {
			return res.status(400).json({
				success: false,
				message: "Phone number is required",
			});
		}

		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		let user = await User.findOne({ phone });

		if (user) {
			// Existing user: update OTP
			user.otpCode = otp;
			user.otpExpires = otpExpires;
			await user.save();
		} else {
			// New user: create temporary user with just phone & OTP
			user = await User.create({
				phone,
				otpCode: otp,
				otpExpires,
				isVerified: false,
			});
		}

		console.log(`OTP for ${phone}: ${otp}`);

		res.status(200).json({
			success: true,
			message: "OTP sent successfully",
			results: { phone, isRegistered: !!user.name, otp }, // help frontend decide next step
		});
	} catch (error) {
		next(error);
	}
};

export const verifyOtpPhone = async (req, res, next) => {
	try {
		const { phone, otp } = req.body;

		if (!phone || !otp) {
			return res.status(400).json({
				success: false,
				message: "Phone number and OTP are required",
			});
		}
		if (!/^\+?[\d\s-()]+$/.test(phone)) {
			return res.status(400).json({
				success: false,
				message: "Invalid phone number format",
			});
		}
		if (!/^\d{6}$/.test(otp)) {
			return res.status(400).json({
				success: false,
				message: "OTP must be a 6-digit number",
			});
		}
		// Find user by phone

		const user = await User.findOne({ phone });

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

		// OTP matched
		user.otpCode = undefined;
		user.otpExpires = undefined;
		user.isVerified = true;
		user.lastLogin = new Date();
		await user.save();

		const token = generateToken(user._id);

		if (user.name && user.email) {
			// Already registered → Login
			return res.status(200).json({
				success: true,
				message: "Login successful",
				results: {
					token,
					user,
					isRegistered: true,
				}, // User is fully registered
			});
		} else {
			// Needs full registration
			return res.status(200).json({
				success: true,
				message: "OTP verified. Proceed to complete registration.",
				results: {
					token,
					user: {
						_id: user._id,
						phone: user.phone,
						isVerified: user.isVerified,
					},
					isRegistered: false, // User needs to complete registration
				},
			});
		}
	} catch (error) {
		next(error);
	}
};

export const completeRegistration = async (req, res, next) => {
	console.log(req.user.id);
	try {
		const {
			name,
			email,
			password,
			userName,
			city,
			state,
			street,
			zipCode,
			country = "India",
		} = req.body;

		const user = await User.findById(req.user.id); // use token from OTP verification

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		if (user.name && user.email) {
			return res.status(400).json({
				success: false,
				message: "User is already registered",
			});
		}

		user.name = name;
		user.email = email;
		user.password = password;
		user.userName = userName;
		user.address = {
			street,
			city,
			state,
			zipCode,
			country,
		};

		await user.save();

		res.status(200).json({
			success: true,
			message: "Registration completed successfully",
			user,
		});
	} catch (error) {
		next(error);
	}
};

// export const login = async (req, res, next) => {
// 	try {
// 		const { email, password } = req.body;

// 		const user = await User.findOne({ email }).select("+password");
// 		if (!user || !(await user.comparePassword(password))) {
// 			return res.status(401).json({
// 				success: false,
// 				message: "Invalid credentials",
// 			});
// 		}

// 		user.lastLogin = new Date();
// 		await user.save();

// 		const token = generateToken(user._id);

// 		res.status(200).json({
// 			success: true,
// 			message: "Login successful",
// 			token,
// 			user,
// 		});
// 	} catch (error) {
// 		next(error);
// 	}
// };

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
