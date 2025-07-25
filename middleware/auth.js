import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
dotenv.config();

export const protect = async (req, res, next) => {
	try {
		let token;

		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
		}

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Not authorized to access this route",
			});
		}

		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			req.user = await User.findById(decoded.id);

			if (!req.user) {
				return res.status(401).json({
					success: false,
					message: "User not found",
				});
			}

			if (!req.user.isActive) {
				return res.status(401).json({
					success: false,
					message: "User account is deactivated",
				});
			}

			next();
		} catch (error) {
			console.error("JWT verification failed:", error.message);
			return res.status(401).json({
				success: false,
				message: "Not authorized to access this route",
			});
		}
	} catch (error) {
		next(error);
	}
};

export const authorize = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				message: `User role ${req.user.role} is not authorized to access this route`,
			});
		}
		next();
	};
};
