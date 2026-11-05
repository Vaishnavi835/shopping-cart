const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

// ─── GET /api/wishlist ─── Get wishlist
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlist");
    return res.status(200).json({ wishlist: user.wishlist });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/wishlist ─── Add to wishlist
router.post("/", protect, async (req, res) => {
  const { productId } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist." });
    }
    user.wishlist.push(productId);

    // 🌟 Log activity: added to wishlist
    const product = await Product.findById(productId);
    user.activityHistory.push({
      action: "added_to_wishlist",
      productName: product?.productName || "Unknown",
      details: `Added ${product?.productName || "a product"} to wishlist`,
    });

    await user.save();
    return res.status(200).json({ message: "Added to wishlist! ❤️" });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── DELETE /api/wishlist/:productId ─── Remove from wishlist
router.delete("/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== req.params.productId
    );
    await user.save();
    return res.status(200).json({ message: "Removed from wishlist." });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;

