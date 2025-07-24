import jwt from "jsonwebtoken";

import dotenv from "dotenv";
dotenv.config();
export const generateToken = (id) => {
	console.log("Generating token for user ID:", id);
	console.log("Generating token for user ID:", process.env.JWT_SECRET);
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE || "30d",
	});
};
