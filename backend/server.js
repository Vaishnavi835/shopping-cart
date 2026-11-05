const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const sanitize = require("./middleware/sanitize");

dotenv.config();
connectDB();

const app = express();

// ─── Security Middleware ───

// Helmet: sets secure HTTP headers with Unsplash / cross-origin image compatibility
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS
app.use(cors());

// Parse JSON body
app.use(express.json({ limit: "10kb" }));

// 🛡️ Request Logging for debugging & monitoring
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  next();
});

// 🛡️ NoSQL Injection Protection (express-mongo-sanitize)
app.use(
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      console.warn(`🛡️ NoSQL injection attempt blocked in ${key}`);
    },
  })
);

// 🛡️ Custom deep sanitization (extra layer)
app.use(sanitize);

// 🛡️ Rate Limiting — prevent brute-force attacks on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to auth routes
app.use("/api/login", authLimiter);
app.use("/api/users", authLimiter);

// ─── Routes ───
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/login", require("./routes/loginRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/smart", require("./routes/smartRoutes"));
app.use("/api/personal", require("./routes/personalRoutes"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "🛒 Shopping Cart API is running!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});
