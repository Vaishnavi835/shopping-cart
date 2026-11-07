// seed.js
// Fetches live data from external link (DummyJSON) and populates MongoDB
// Usage: node seed.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const Product = require("./models/Product");

const EXTERNAL_API_URL = "https://dummyjson.com/products?limit=100";

function formatCategory(cat) {
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
}

async function seedFromExternal() {
  console.log("🌐 Connecting to MongoDB...");
  await connectDB();

  console.log(`📡 Fetching live product data from external API: ${EXTERNAL_API_URL}...`);
  const res = await fetch(EXTERNAL_API_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch from external link: ${res.statusText}`);
  }

  const data = await res.json();
  const rawProducts = data.products || [];
  console.log(`📦 Fetched ${rawProducts.length} items from external link.`);

  const mapped = rawProducts.map((p) => ({
    productId: `EXT-${p.id}`,
    productName: p.title || "Product",
    productPrice: Math.round((p.price || 10) * 80),
    category: formatCategory(p.category),
    quantity: Math.max(15, p.stock || 45),
    description: p.description || "Verified product from catalogue.",
    imageUrl: p.thumbnail || (p.images && p.images[0]) || "",
    discount: Math.min(100, Math.max(0, Math.round(p.discountPercentage || 0))),
    ratings: (p.reviews || []).slice(0, 3).map((r) => ({
      rating: r.rating || 5,
      review: r.comment || "Great product!",
      createdAt: r.date ? new Date(r.date) : new Date(),
    })),
  }));

  console.log("Clearing existing products in MongoDB...");
  await Product.deleteMany({});

  console.log(`Inserting ${mapped.length} products into MongoDB...`);
  await Product.insertMany(mapped);

  console.log(`✅ MongoDB successfully seeded with ${mapped.length} products from external link!`);
  process.exit(0);
}

seedFromExternal().catch((err) => {
  console.error("❌ Seed error:", err.message);
  process.exit(1);
});
