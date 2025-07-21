import express from "express"
import User from "../models/User.js"
import { protect, authorize } from "../middleware/auth.js"

const router = express.Router()

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get("/", protect, authorize("admin"), async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const users = await User.find({ isActive: true })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments({ isActive: true })

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", protect, async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body

    const user = await User.findById(req.user.id)

    if (user) {
      user.name = name || user.name
      user.email = email || user.email
      user.phone = phone || user.phone
      user.address = address || user.address

      const updatedUser = await user.save()

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      })
    } else {
      res.status(404).json({
        success: false,
        message: "User not found",
      })
    }
  } catch (error) {
    next(error)
  }
})

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete("/:id", protect, authorize("admin"), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Soft delete - deactivate user
    user.isActive = false
    await user.save()

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
router.get("/:id", protect, authorize("admin"), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
})

export default router
