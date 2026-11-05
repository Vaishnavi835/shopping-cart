const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

// ─── GET /api/products ─── Get all products (public catalogue)
router.get("/", async (req, res) => {
  try {
    const { category, search, sort, minPrice, maxPrice } = req.query;
    let filter = {};

    // 🌟 UNIQUE FEATURE: Filter by category
    if (category && category !== "All") {
      filter.category = category;
    }

    // 🌟 UNIQUE FEATURE: Search products by name
    if (search) {
      filter.productName = { $regex: search, $options: "i" };
    }

    // 🌟 UNIQUE FEATURE: Filter by price range
    if (minPrice || maxPrice) {
      filter.productPrice = {};
      if (minPrice) filter.productPrice.$gte = Number(minPrice);
      if (maxPrice) filter.productPrice.$lte = Number(maxPrice);
    }

    let query = Product.find(filter);

    // 🌟 UNIQUE FEATURE: Sort products
    if (sort === "price_asc") query = query.sort({ productPrice: 1 });
    else if (sort === "price_desc") query = query.sort({ productPrice: -1 });
    else if (sort === "name_asc") query = query.sort({ productName: 1 });

    const products = await query;

    if (products.length === 0) {
      return res.status(200).json({ message: "No products available.", products: [] });
    }
    return res.status(200).json({ products });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// 🌟 UNIQUE FEATURE: GET /api/products/categories ─── Get all unique categories (public)
router.get("/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    return res.status(200).json({ categories });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// 🌟 UNIQUE FEATURE: POST /api/products/:id/review ─── Add rating & review
router.post("/:id/review", protect, async (req, res) => {
  const { rating, review } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    // Prevent duplicate review from same user
    const alreadyReviewed = product.ratings.find(
      (r) => r.userId.toString() === req.user.id
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: "You have already reviewed this product." });
    }

    product.ratings.push({ userId: req.user.id, rating, review });
    await product.save();
    return res.status(201).json({ message: "Review added!", averageRating: product.averageRating });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;

