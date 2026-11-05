// Run this script once to seed sample products into MongoDB
// Usage: node seed.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Use the same DB connection logic as the server (includes DNS fallback & direct URI)
const connectDB = require("./config/db");

const Product = require("./models/Product");

const products = [
  {
    productId: "P001",
    productName: "Wireless Bluetooth Headphones",
    productPrice: 2999,
    category: "Electronics",
    quantity: 25,
    description: "Premium sound quality with 30-hour battery life and noise cancellation.",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
    discount: 10,
  },
  {
    productId: "P002",
    productName: "Running Shoes",
    productPrice: 1499,
    category: "Footwear",
    quantity: 50,
    description: "Lightweight and breathable running shoes with cushioned sole.",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300",
    discount: 5,
  },
  {
    productId: "P003",
    productName: "Cotton T-Shirt",
    productPrice: 499,
    category: "Clothing",
    quantity: 100,
    description: "100% pure cotton, available in multiple colors. Machine washable.",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300",
    discount: 0,
  },
  {
    productId: "P004",
    productName: "Stainless Steel Water Bottle",
    productPrice: 799,
    category: "Kitchen",
    quantity: 40,
    description: "Keeps drinks cold for 24 hours and hot for 12 hours. BPA-free.",
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300",
    discount: 15,
  },
  {
    productId: "P005",
    productName: "Yoga Mat",
    productPrice: 1199,
    category: "Sports",
    quantity: 30,
    description: "Non-slip, eco-friendly yoga mat with carrying strap. 6mm thick.",
    imageUrl: "https://images.unsplash.com/photo-1601925228245-9c6c56b1d8b7?w=300",
    discount: 0,
  },
  {
    productId: "P006",
    productName: "Mechanical Keyboard",
    productPrice: 3499,
    category: "Electronics",
    quantity: 15,
    description: "RGB backlit mechanical keyboard with tactile blue switches.",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300",
    discount: 20,
  },
  {
    productId: "P007",
    productName: "Python Programming Book",
    productPrice: 599,
    category: "Books",
    quantity: 60,
    description: "Complete guide to Python programming for beginners to advanced level.",
    imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300",
    discount: 0,
  },
  {
    productId: "P008",
    productName: "Sunglasses UV400",
    productPrice: 899,
    category: "Accessories",
    quantity: 45,
    description: "Polarized UV400 protection sunglasses with lightweight frame.",
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300",
    discount: 8,
  },
  {
    productId: "P009",
    productName: "Smartwatch Pro",
    productPrice: 7999,
    category: "Electronics",
    quantity: 20,
    description: "Feature-rich smartwatch with heart-rate monitor and GPS.",
    imageUrl: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=300",
    discount: 12,
  },
  {
    productId: "P010",
    productName: "Leather Wallet",
    productPrice: 1199,
    category: "Accessories",
    quantity: 70,
    description: "Genuine leather wallet with RFID protection.",
    imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=300",
    discount: 5,
  },
  {
    productId: "P011",
    productName: "Bluetooth Speaker",
    productPrice: 2499,
    category: "Electronics",
    quantity: 35,
    description: "Portable speaker with 12h battery and deep bass.",
    imageUrl: "https://images.unsplash.com/photo-1585386959984-a4155222412f?w=300",
    discount: 15,
  },
  {
    productId: "P012",
    productName: "Running Shorts",
    productPrice: 899,
    category: "Clothing",
    quantity: 80,
    description: "Moisture-wicking shorts for comfortable runs.",
    imageUrl: "https://images.unsplash.com/photo-1586172218058-443b44aaec1f?w=300",
    discount: 0,
  },
  {
    productId: "P013",
    productName: "Stainless Steel Cookware Set",
    productPrice: 4999,
    category: "Kitchen",
    quantity: 25,
    description: "10-piece durable cookware set, oven safe.",
    imageUrl: "https://images.unsplash.com/photo-1605478431277-5f9b962b2c69?w=300",
    discount: 20,
  },
  {
    productId: "P014",
    productName: "Gaming Mouse",
    productPrice: 1999,
    category: "Electronics",
    quantity: 40,
    description: "Ergonomic mouse with programmable DPI.",
    imageUrl: "https://images.unsplash.com/photo-1517260736850-5b0c27b9e5e3?w=300",
    discount: 10,
  },
  {
    productId: "P015",
    productName: "Travel Backpack",
    productPrice: 3499,
    category: "Accessories",
    quantity: 30,
    description: "Water-resistant backpack with multiple compartments.",
    imageUrl: "https://images.unsplash.com/photo-1468454883922-91b907ef81d2?w=300",
    discount: 8,
  },
];

async function seed() {
  await connectDB();
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log("✅ Database seeded with", products.length, "products!");
  process.exit();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

