import express from "express"
import Order from "../models/Order.js"
import Cart from "../models/Cart.js"
import Product from "../models/Product.js"
import { protect, authorize } from "../middleware/auth.js"

const router = express.Router()

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post("/", protect, async (req, res, next) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No order items",
      })
    }

    // Verify inventory for all items
    for (const item of orderItems) {
      const product = await Product.findById(item.product)
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`,
        })
      }

      if (product.inventory.trackQuantity && product.inventory.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for ${product.name}`,
        })
      }
    }

    const order = new Order({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    })

    const createdOrder = await order.save()

    // Update product inventory
    for (const item of orderItems) {
      const product = await Product.findById(item.product)
      if (product.inventory.trackQuantity) {
        product.inventory.quantity -= item.quantity
        await product.save()
      }
    }

    // Clear user's cart
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] })

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: createdOrder,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get("/myorders", protect, async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit)

    const total = await Order.countDocuments({ user: req.user.id })

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get("/:id", protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("orderItems.product", "name")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      })
    }

    res.status(200).json({
      success: true,
      data: order,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
router.put("/:id/pay", protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this order",
      })
    }

    order.isPaid = true
    order.paidAt = Date.now()
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    }

    const updatedOrder = await order.save()

    res.status(200).json({
      success: true,
      message: "Order updated to paid",
      data: updatedOrder,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
router.get("/", protect, authorize("admin"), async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const orders = await Order.find({})
      .populate("user", "id name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Order.countDocuments({})

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put("/:id/status", protect, authorize("admin"), async (req, res, next) => {
  try {
    const { status, trackingNumber } = req.body

    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    order.status = status
    if (trackingNumber) {
      order.trackingNumber = trackingNumber
    }

    if (status === "delivered") {
      order.isDelivered = true
      order.deliveredAt = Date.now()
    }

    const updatedOrder = await order.save()

    res.status(200).json({
      success: true,
      message: "Order status updated",
      data: updatedOrder,
    })
  } catch (error) {
    next(error)
  }
})

export default router
