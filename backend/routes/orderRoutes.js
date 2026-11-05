const express = require("express");
const router = express.Router();
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

// ─── GET /api/orders ─── Get order history
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("orderHistory username");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ orderHistory: user.orderHistory });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;

