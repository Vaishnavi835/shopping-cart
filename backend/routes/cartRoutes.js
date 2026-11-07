const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

// All cart routes are protected
// ─── GET /api/cart ─── Get user's cart
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product");
    if (!user) return res.status(404).json({ message: "User not found." });

    // 🛡️ Auto-clean any cart items where product was deleted/unseeded
    const initialCount = user.cart.length;
    user.cart = user.cart.filter((item) => item.product && item.product._id);
    if (user.cart.length !== initialCount) {
      await user.save();
    }

    return res.status(200).json({ cart: user.cart });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/cart ─── Add item to cart
router.post("/", protect, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found." });
    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock." });
    }

    const itemIndex = user.cart.findIndex((i) => i.product.toString() === productId);
    if (itemIndex > -1) {
      user.cart[itemIndex].quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }
    // 🌟 Log activity: added to cart
    user.activityHistory.push({
      action: "added_to_cart",
      productName: product.productName,
      details: `Added ${quantity} × ${product.productName} to cart`,
    });

    await user.save();
    return res.status(200).json({ message: "Item added to cart.", cart: user.cart });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── PATCH /api/cart/:productId ─── Update quantity
router.patch("/:productId", protect, async (req, res) => {
  const { quantity } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const itemIndex = user.cart.findIndex(
      (i) => i.product.toString() === req.params.productId
    );
    if (itemIndex === -1) return res.status(404).json({ message: "Item not in cart." });

    if (quantity <= 0) {
      user.cart.splice(itemIndex, 1);
    } else {
      user.cart[itemIndex].quantity = quantity;
    }
    await user.save();
    return res.status(200).json({ message: "Cart updated.", cart: user.cart });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── DELETE /api/cart/:productId ─── Remove item
router.delete("/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter(
      (i) => i.product.toString() !== req.params.productId
    );
    await user.save();
    return res.status(200).json({ message: "Item removed from cart.", cart: user.cart });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/cart/swap ─── Swap an item in cart with an optimized replacement
router.post("/swap", protect, async (req, res) => {
  const { currentProductId, replacementProductId } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const replacement = await Product.findById(replacementProductId);
    if (!replacement) return res.status(404).json({ message: "Replacement product not found." });
    if (replacement.quantity < 1) {
      return res.status(400).json({ message: "Replacement product is out of stock." });
    }

    const currentIndex = user.cart.findIndex(
      (i) => i.product.toString() === currentProductId
    );
    if (currentIndex === -1) {
      return res.status(404).json({ message: "Current item not in cart." });
    }

    const currentQty = user.cart[currentIndex].quantity;
    const finalQty = Math.min(currentQty, replacement.quantity);

    // Remove old item, add new item
    user.cart.splice(currentIndex, 1);

    const existingRepIndex = user.cart.findIndex(
      (i) => i.product.toString() === replacementProductId
    );
    if (existingRepIndex > -1) {
      user.cart[existingRepIndex].quantity += finalQty;
    } else {
      user.cart.push({ product: replacementProductId, quantity: finalQty });
    }

    user.activityHistory.push({
      action: "optimized_cart",
      productName: replacement.productName,
      details: `Swapped for ${replacement.productName} (Cart Optimization)`,
    });

    await user.save();
    const updatedUser = await User.findById(req.user.id).populate("cart.product");
    return res.status(200).json({
      message: `Swapped with ${replacement.productName}!`,
      cart: updatedUser.cart,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/cart/checkout ─── Place order (save to order history)
router.post("/checkout", protect, async (req, res) => {
  try {
    const { deliveryAddress, paymentMethod = "Card" } = req.body || {};
    const user = await User.findById(req.user.id).populate("cart.product");
    if (!user) return res.status(404).json({ message: "User not found." });

    // Filter to only valid products
    user.cart = user.cart.filter((item) => item.product && item.product._id);
    if (!user.cart.length) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of user.cart) {
      const product = item.product;
      if (!product) continue;
      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.productName}.` });
      }
      // Deduct stock
      product.quantity -= item.quantity;
      await product.save();

      const discountedPrice = product.productPrice * (1 - (product.discount || 0) / 100);
      totalAmount += discountedPrice * item.quantity;
      orderItems.push({
        productName: product.productName,
        price: parseFloat(discountedPrice.toFixed(2)),
        quantity: item.quantity,
        imageUrl: product.imageUrl || "",
      });
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder = {
      orderId,
      items: orderItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending on Delivery" : "Paid Successfully",
      deliveryAddress: deliveryAddress || {
        fullName: user.username,
        phone: user.phone || "",
        street: user.address?.street || "Standard Address",
        city: user.address?.city || "",
        state: user.address?.state || "",
        postalCode: user.address?.postalCode || "",
        country: user.address?.country || "India",
      },
      orderedAt: new Date(),
    };

    user.orderHistory.unshift(newOrder);

    // 🌟 Log activity: placed order
    user.activityHistory.push({
      action: "placed_order",
      details: `Placed order ${orderId} for ${orderItems.length} items — ₹${totalAmount.toFixed(2)} via ${paymentMethod}`,
    });

    user.cart = [];
    await user.save();

    return res.status(200).json({
      message: "Order placed successfully! 🎉",
      order: newOrder,
      orderId,
      totalAmount: totalAmount.toFixed(2),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;

