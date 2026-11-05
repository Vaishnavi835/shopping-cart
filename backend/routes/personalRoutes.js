const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

// ─── GET /api/personal/dashboard ─── Personalized Shopping Dashboard
router.get("/dashboard", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("cart.product")
      .populate("wishlist")
      .populate("recentlyViewed.product");
    if (!user) return res.status(404).json({ message: "User not found." });

    const totalOrders = user.orderHistory.length;
    const totalSpent = user.orderHistory.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const cartCount = user.cart.length;
    const wishlistCount = user.wishlist.length;
    const recentActivity = user.activityHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
    const budgetRemaining = user.budget - totalSpent;

    return res.status(200).json({
      dashboard: {
        username: user.username,
        totalOrders,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        cartCount,
        wishlistCount,
        recentActivity,
        budget: user.budget,
        budgetRemaining: parseFloat(budgetRemaining.toFixed(2)),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/personal/recently-viewed/:productId ─── Track Recently Viewed
router.post("/recently-viewed/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found." });

    // Remove duplicate if exists
    user.recentlyViewed = user.recentlyViewed.filter(
      (rv) => rv.product.toString() !== req.params.productId
    );

    // Push to front
    user.recentlyViewed.unshift({ product: req.params.productId, viewedAt: new Date() });

    // Keep only last 20 items
    if (user.recentlyViewed.length > 20) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 20);
    }

    // Log to activityHistory
    user.activityHistory.push({
      action: "viewed_product",
      productName: product.productName,
      details: `Viewed ${product.productName}`,
    });

    await user.save();
    return res.status(200).json({ message: "Tracked" });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/personal/recently-viewed ─── Get Recently Viewed
router.get("/recently-viewed", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("recentlyViewed.product");
    if (!user) return res.status(404).json({ message: "User not found." });

    // Sort newest first, limit 20
    const recentlyViewed = user.recentlyViewed
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 20);

    return res.status(200).json({ recentlyViewed });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/personal/recommendations ─── Personalized Recommendations
router.get("/recommendations", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("recentlyViewed.product")
      .populate("wishlist")
      .populate("cart.product");
    if (!user) return res.status(404).json({ message: "User not found." });

    // Gather categories from recently viewed and wishlist
    const categories = new Set();
    user.recentlyViewed.forEach((rv) => {
      if (rv.product && rv.product.category) categories.add(rv.product.category);
    });
    user.wishlist.forEach((w) => {
      if (w && w.category) categories.add(w.category);
    });

    if (categories.size === 0) {
      return res.status(200).json({ recommendations: [] });
    }

    // Get IDs already in cart and wishlist to exclude
    const cartProductIds = user.cart.map((c) => c.product?._id?.toString()).filter(Boolean);
    const wishlistProductIds = user.wishlist.map((w) => w?._id?.toString()).filter(Boolean);
    const excludeIds = [...new Set([...cartProductIds, ...wishlistProductIds])];

    // Find products in those categories, not in cart or wishlist
    const recommendations = await Product.find({
      category: { $in: Array.from(categories) },
      _id: { $nin: excludeIds },
      quantity: { $gt: 0 },
    })
      .sort({ "ratings.length": -1 }) // We'll sort manually for average rating
      .limit(50); // Get more and sort manually

    // Sort by average rating descending
    const sorted = recommendations
      .map((p) => {
        let avgRating = 0;
        if (p.ratings && p.ratings.length > 0) {
          const sum = p.ratings.reduce((acc, r) => acc + r.rating, 0);
          avgRating = sum / p.ratings.length;
        }
        return { product: p, avgRating };
      })
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10)
      .map((item) => item.product);

    return res.status(200).json({ recommendations: sorted });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/personal/activity ─── Shopping Activity History
router.get("/activity", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const activityHistory = user.activityHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50);

    return res.status(200).json({ activityHistory });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/personal/restock-notify/:productId ─── Subscribe to Restock
router.post("/restock-notify/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const productId = req.params.productId;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found." });

    // Add if not already subscribed
    if (!user.restockNotifications.includes(productId)) {
      user.restockNotifications.push(productId);
      await user.save();
    }

    return res.status(200).json({ message: "Subscribed to restock notification" });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── DELETE /api/personal/restock-notify/:productId ─── Unsubscribe
router.delete("/restock-notify/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.restockNotifications = user.restockNotifications.filter(
      (id) => id.toString() !== req.params.productId
    );
    await user.save();

    return res.status(200).json({ message: "Unsubscribed" });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/personal/restock-notify ─── Get Restock Subscriptions
router.get("/restock-notify", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("restockNotifications");
    if (!user) return res.status(404).json({ message: "User not found." });

    return res.status(200).json({ restockNotifications: user.restockNotifications });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;
