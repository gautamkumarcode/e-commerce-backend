import express from "express";
import {
	forgotPassword,
	getMe,
	login,
	logout,
	sendOtp,
	verifyOtp,
} from "../controller/auth-controller.js";
import { protect } from "../middleware/auth.js";
import {
	loginSchema,
	registerSchema,
	validateRequest,
	verifyOtpSchema,
} from "../middleware/validationSchema/validation.js";

const router = express.Router();

// @route   POST /api/auth/register
router.post("/send-otp", validateRequest(registerSchema), sendOtp);
router.post("/verify-otp", validateRequest(verifyOtpSchema), verifyOtp);

// @route   POST /api/auth/login
router.post("/login", validateRequest(loginSchema), login);

// @route   GET /api/auth/me
router.get("/me", protect, getMe);

// @route   POST /api/auth/logout
router.post("/logout", protect, logout);

// @route   POST /api/auth/forgotpassword
router.post("/forgotpassword", forgotPassword);

export default router;
