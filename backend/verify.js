// Verify that seed data is present in MongoDB
require('dotenv').config();
const connectDB = require('./config/db');
const Product = require('./models/Product');

async function verify() {
  try {
    await connectDB();
    const count = await Product.countDocuments();
    console.log('📦 Total products in DB:', count);
    const sample = await Product.find().limit(5);
    console.log('Sample docs:', sample);
    process.exit();
  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  }
}

verify();
