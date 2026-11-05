const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

// ─── GET /api/smart/cheaper/:productId ─── Cheaper Alternatives (public)
router.get("/cheaper/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const currentDiscountedPrice = product.productPrice * (1 - product.discount / 100);

    // Find products in the same category with lower discountedPrice
    const allInCategory = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    });

    const cheaperAlternatives = allInCategory
      .map((p) => {
        const dp = p.productPrice * (1 - p.discount / 100);
        return { product: p, discountedPrice: dp };
      })
      .filter((item) => item.discountedPrice < currentDiscountedPrice)
      .sort((a, b) => a.discountedPrice - b.discountedPrice)
      .slice(0, 6)
      .map((item) => item.product);

    return res.status(200).json({ product, cheaperAlternatives });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/smart/compare ─── Smart Product Comparison (public)
router.post("/compare", async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Please provide productIds array." });
    }
    if (productIds.length > 3) {
      return res.status(400).json({ message: "You can compare a maximum of 3 products." });
    }

    const products = await Product.find({ _id: { $in: productIds } });
    return res.status(200).json({ products });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/smart/optimize-cart ─── Smart Cart Optimization
router.get("/optimize-cart", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product");
    if (!user) return res.status(404).json({ message: "User not found." });

    const suggestions = [];

    for (const item of user.cart) {
      const currentProduct = item.product;
      if (!currentProduct) continue;

      const currentDiscountedPrice = currentProduct.productPrice * (1 - currentProduct.discount / 100);

      // Find cheaper alternatives in the same category that are in stock
      const alternatives = await Product.find({
        category: currentProduct.category,
        _id: { $ne: currentProduct._id },
        quantity: { $gt: 0 },
      });

      const cheaperAlt = alternatives
        .map((p) => {
          const dp = p.productPrice * (1 - p.discount / 100);
          return { product: p, discountedPrice: dp };
        })
        .filter((a) => a.discountedPrice < currentDiscountedPrice)
        .sort((a, b) => a.discountedPrice - b.discountedPrice);

      if (cheaperAlt.length > 0) {
        const best = cheaperAlt[0];
        suggestions.push({
          currentProduct,
          suggestedProduct: best.product,
          savings: parseFloat((currentDiscountedPrice - best.discountedPrice).toFixed(2)),
        });
      }
    }

    return res.status(200).json({ suggestions });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/smart/budget ─── Get Budget
router.get("/budget", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const spent = user.orderHistory.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const remaining = user.budget - spent;

    return res.status(200).json({
      budget: user.budget,
      spent: parseFloat(spent.toFixed(2)),
      remaining: parseFloat(remaining.toFixed(2)),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── PUT /api/smart/budget ─── Set Budget
router.put("/budget", protect, async (req, res) => {
  try {
    const { budget } = req.body;
    if (budget === undefined || budget === null) {
      return res.status(400).json({ message: "Please provide a budget value." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.budget = budget;
    await user.save();

    const spent = user.orderHistory.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const remaining = user.budget - spent;

    return res.status(200).json({
      budget: user.budget,
      spent: parseFloat(spent.toFixed(2)),
      remaining: parseFloat(remaining.toFixed(2)),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/smart/budget-recommendations ─── Budget-Friendly Recommendations
router.get("/budget-recommendations", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const spent = user.orderHistory.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const remaining = user.budget - spent;

    // Find products with discountedPrice <= remaining budget
    const allProducts = await Product.find({ quantity: { $gt: 0 } });
    const recommendations = allProducts
      .map((p) => {
        const dp = p.productPrice * (1 - p.discount / 100);
        return { product: p, discountedPrice: dp };
      })
      .filter((item) => item.discountedPrice <= remaining)
      .sort((a, b) => {
        // Sort by best value: discount descending, then price ascending
        if (b.product.discount !== a.product.discount) {
          return b.product.discount - a.product.discount;
        }
        return a.discountedPrice - b.discountedPrice;
      })
      .slice(0, 10)
      .map((item) => item.product);

    return res.status(200).json({
      remaining: parseFloat(remaining.toFixed(2)),
      recommendations,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/smart/best-value ─── Best Value Indicator (public)
router.get("/best-value", async (req, res) => {
  try {
    // Find products that are in stock
    const products = await Product.find({ quantity: { $gt: 0 } });

    const scored = products.map((p) => {
      // Calculate average rating
      let avgRating = 0;
      if (p.ratings && p.ratings.length > 0) {
        const sum = p.ratings.reduce((acc, r) => acc + r.rating, 0);
        avgRating = sum / p.ratings.length;
      }
      // Score: (discount * 0.6) + (averageRating * 8)
      const score = (p.discount * 0.6) + (avgRating * 8);
      return { product: p, score };
    });

    // Sort by score descending, limit to 10
    scored.sort((a, b) => b.score - a.score);
    const bestValueProducts = scored.slice(0, 10).map((item) => item.product);

    return res.status(200).json({ bestValueProducts });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;
