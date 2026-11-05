# NOVA — Modern Fashion & Lifestyle E-Commerce Platform

A full-stack MERN (MongoDB, Express, React, Node.js) shopping cart and fashion e-commerce application featuring a Rose Gold & Champagne Pink visual identity, smart shopping intelligence, and a responsive Myntra-inspired user interface.

---

## ✨ Features

- **Catalogue & Search**: Live keyword search, category filtering, multi-factor sorting (price, name, rating), and price range filter.
- **Smart Recommendations**:
  - 🔥 **Best Value Deals**: Algorithmic scoring based on discounts and customer reviews.
  - 🔄 **Product Comparison**: Side-by-side comparison modal for up to 3 products.
  - 💡 **Cheaper Alternatives**: 1-click discovery of budget-friendly alternatives in the same category.
- **User Dashboard**:
  - Monthly budget setting and live expenditure progress tracking.
  - Recently viewed items carousel.
  - Order history and order status tracking.
  - Out-of-stock restock notification alerts.
- **Interactive Reviews**: Star ratings, text reviews, and calculated average product ratings.
- **Modern UI & Theming**:
  - Custom palette: Rose Gold (`#c94b72`), Champagne Gold (`#d4a373`), and soft blush backgrounds.
  - Typography: Google Fonts **Outfit** & **Plus Jakarta Sans**.
  - Built-in Dark Mode toggle with persistent localStorage theme preference.
- **Security & Reliability**:
  - JWT-based authentication with auto-expiry logout.
  - Rate limiting on sensitive routes.
  - NoSQL injection protection (`express-mongo-sanitize`).
  - Strict input sanitization and secure HTTP headers (`helmet`).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router v6, CSS3 (Custom Responsive Design)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT), bcryptjs

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB Atlas cluster or local MongoDB instance

### 2. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory (see `backend/.env.example`):
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the backend server:
```bash
npm start
# or for auto-reload during development:
npx nodemon server.js
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173`.

---

## 📁 Project Structure

```
shopping-cart/
├── backend/
│   ├── config/          # Database connection
│   ├── middleware/      # Auth & security sanitizers
│   ├── models/          # Mongoose Schemas (User, Product, Order)
│   ├── routes/          # Express API routes
│   └── server.js        # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Navbar, Modals, Toasts
│   │   ├── context/     # Auth & State Context
│   │   ├── pages/       # Products, Dashboard, Cart, Auth
│   │   └── index.css    # Custom styling & theming
│   └── vite.config.js
└── README.md
```

