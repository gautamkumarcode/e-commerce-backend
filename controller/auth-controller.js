import crypto from "crypto";
import User from "../models/User.js";
import { generateToken } from "../services/token.js";



// In-memory cooldown store to prevent OTP resend spam
const otpCooldownStore = new Map();

// Helper: Normalize phone to last 10 digits
const normalizePhone = (phone) => phone.replace(/^(\+91|0)+/, "").slice(-10);

// 🟢 Send OTP (Debounced for 60 seconds)
export const sendOtpToPhone = async (req, res, next) => {
	try {
		let { phone } = req.body;

		if (!phone) {
			return res.status(400).json({
				success: false,
				message: "Phone number is required",
			});
		}

		phone = normalizePhone(phone);

		// Check cooldown
		const now = Date.now();
		const lastSent = otpCooldownStore.get(phone);
		if (lastSent && now - lastSent < 60 * 1000) {
			return res.status(429).json({
				success: false,
				message:
					"OTP already sent. Please wait 60 seconds before trying again.",
			});
		}

		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = new Date(now + 10 * 60 * 1000);

		// Try find + update user in one go
		let user = await User.findOneAndUpdate(
			{ phone },
			{
				$set: {
					otpCode: otp,
					otpExpires,
					isVerified: false,
				},
			},
			{ new: true }
		);

		// If user doesn't exist, create one
		if (!user) {
			try {
				user = new User({
					phone,
					otpCode: otp,
					otpExpires,
					isVerified: false,
				});

				await user.save({ validateBeforeSave: false });
			} catch (error) {
				// Handle duplicate error race condition
				if (error.code === 11000) {
					user = await User.findOneAndUpdate(
						{ phone },
						{
							$set: {
								otpCode: otp,
								otpExpires,
								isVerified: false,
							},
						},
						{ new: true }
					);
				} else {
					throw error;
				}
			}
		}

		// Save cooldown
		otpCooldownStore.set(phone, now);

		console.log(`📨 OTP for ${phone}: ${otp}`);

		return res.status(200).json({
			success: true,
			message: "OTP sent successfully",
			results: {
				phone,
				otp, // ⚠️ remove in production
				isRegistered: !!user.name,
			},
		});
	} catch (error) {
		next(error);
	}
};

// ✅ Verify OTP and login/register
export const verifyOtpPhone = async (req, res, next) => {
	try {
		let { phone, otp } = req.body;

		if (!phone || !otp) {
			return res.status(400).json({
				success: false,
				message: "Phone number and OTP are required",
			});
		}

		phone = normalizePhone(phone);

		const user = await User.findOne({ phone });

		if (!user) {
			return res.status(400).json({
				success: false,
				message: "User not found",
			});
		}

		if (!user.otpCode || user.otpCode !== otp) {
			return res.status(400).json({
				success: false,
				message: "Invalid OTP",
			});
		}

		if (user.otpExpires < new Date()) {
			return res.status(400).json({
				success: false,
				message: "OTP expired",
			});
		}

		// Clear OTP fields
		user.otpCode = undefined;
		user.otpExpires = undefined;
		user.isVerified = true;
		await user.save();

		const token = generateToken(user._id);

		const userObj = user.toObject();
		delete userObj.password;

		return res.status(200).json({
			success: true,
			message: "Login successful",
			results: {
				user: userObj,
				token,
			},
		});
	} catch (error) {
		next(error);
	}
};

// Optional: Cleanup stale cooldown entries
setInterval(() => {
	const now = Date.now();
	for (const [phone, timestamp] of otpCooldownStore.entries()) {
		if (now - timestamp > 5 * 60 * 1000) {
			otpCooldownStore.delete(phone);
		}
	}
}, 60 * 1000); // Run every 60 seconds

export const completeRegistration = async (req, res, next) => {
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
