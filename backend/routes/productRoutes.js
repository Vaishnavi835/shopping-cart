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

// 🌟 UNIQUE FEATURE: POST /api/products/sync-external ─── Sync from external link (DummyJSON)
router.post("/sync-external", async (req, res) => {
  try {
    const response = await fetch("https://dummyjson.com/products?limit=100");
    if (!response.ok) {
      return res.status(500).json({ message: "Failed to fetch from external link" });
    }
    const data = await response.json();
    const raw = data.products || [];

    const formatCategory = (cat) => {
      if (!cat) return "General";
      const map = {
        "beauty": "Beauty",
        "fragrances": "Beauty",
        "furniture": "Home",
        "groceries": "Kitchen",
        "home-decoration": "Home",
        "kitchen-accessories": "Kitchen",
        "laptops": "Electronics",
        "mens-shirts": "Clothing",
        "mens-shoes": "Footwear",
        "mens-watches": "Accessories",
        "mobile-accessories": "Electronics",
        "motorcycle": "Automotive",
        "skin-care": "Beauty",
        "smartphones": "Electronics",
        "sports-accessories": "Sports",
        "sunglasses": "Accessories",
        "tablets": "Electronics",
        "tops": "Clothing",
        "vehicle": "Automotive",
        "womens-bags": "Accessories",
        "womens-dresses": "Clothing",
        "womens-jewellery": "Accessories",
        "womens-shoes": "Footwear",
        "womens-watches": "Accessories",
      };
      return map[cat.toLowerCase()] || cat.charAt(0).toUpperCase() + cat.slice(1);
    };

    const formatted = raw.map((p) => ({
      productId: `EXT-${p.id}`,
      productName: p.title || "Product",
      productPrice: Math.round((p.price || 10) * 80),
      category: formatCategory(p.category),
      quantity: Math.max(15, p.stock || 45),
      description: p.description || "High quality verified product.",
      imageUrl: p.thumbnail || (p.images && p.images[0]) || "",
      discount: Math.min(100, Math.max(0, Math.round(p.discountPercentage || 0))),
      ratings: (p.reviews || []).slice(0, 3).map((r) => ({
        rating: r.rating || 5,
        review: r.comment || "Great product!",
        createdAt: r.date ? new Date(r.date) : new Date(),
      })),
    }));

    await Product.deleteMany({});
    await Product.insertMany(formatted);

    return res.status(200).json({
      message: `Successfully synced ${formatted.length} products from external link!`,
      count: formatted.length,
    });
  } catch (err) {
    return res.status(500).json({ message: "Sync error: " + err.message });
  }
});

module.exports = router;

