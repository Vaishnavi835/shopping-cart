import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';
import FreeDeliveryBar from '../components/FreeDeliveryBar';
import './Cart.css';

export default function Cart() {
  const { token, authFetch, setCartCount, user } = useAuth();
  const { toast, showToast } = useToast();
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  // 🌟 Smart Cart Optimization state
  const [optimizerSuggestions, setOptimizerSuggestions] = useState([]);
  const [loadingOptimizer, setLoadingOptimizer] = useState(false);
  const [swappingId, setSwappingId] = useState(null);

  // 🌟 Budget Monitoring state
  const [budgetInfo, setBudgetInfo] = useState({ budget: 0, spent: 0, remaining: 0 });

  // 🌟 Coupon code state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // 🌟 Recommended products state
  const [recommended, setRecommended] = useState([]);
  const [addingRecId, setAddingRecId] = useState(null);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchCartAndData = async () => {
    setLoading(true);
    try {
      const [cartRes, budgetRes] = await Promise.all([
        fetch('/api/cart', { headers: authHeader }),
        authFetch('/api/smart/budget'),
      ]);

      if (cartRes.ok) {
        const data = await cartRes.json();
        // 🛡️ Keep only valid products with populated details
        const validItems = (data.cart || []).filter(
          (i) => i && i.product && typeof i.product === 'object' && i.product._id
        );
        setCart(validItems);
        const count = validItems.reduce((s, i) => s + (i.quantity || 1), 0);
        setCartCount(count);
      }

      if (budgetRes.ok) {
        const b = await budgetRes.json();
        setBudgetInfo(b);
      }
    } catch {
      showToast('Error loading cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartAndData();
  }, [token]);

  // Fetch optimizer suggestions when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      setLoadingOptimizer(true);
      authFetch('/api/smart/optimize-cart')
        .then((r) => r.json())
        .then((data) => {
          setOptimizerSuggestions(data.suggestions || []);
        })
        .catch(() => {})
        .finally(() => setLoadingOptimizer(false));
    } else {
      setOptimizerSuggestions([]);
    }
  }, [cart, authFetch]);

  // Fetch recommended products
  useEffect(() => {
    fetch('/api/products?limit=4')
      .then((r) => r.json())
      .then((data) => {
        if (data.products) {
          setRecommended(data.products.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  const updateQty = async (productId, quantity) => {
    await fetch(`/api/cart/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ quantity }),
    });
    fetchCartAndData();
  };

  const removeItem = async (productId) => {
    await fetch(`/api/cart/${productId}`, { method: 'DELETE', headers: authHeader });
    showToast('Item removed from cart');
    fetchCartAndData();
  };

  // Move item to wishlist
  const moveToWishlist = async (product) => {
    try {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ productId: product._id }),
      });
      await removeItem(product._id);
      showToast(`❤️ Moved "${product.productName}" to your Wishlist!`);
    } catch {
      showToast('Error moving item to Wishlist');
    }
  };

  // 🌟 Swap item with an optimized cheaper replacement
  const handleSwapItem = async (currentProductId, replacementProductId, savings) => {
    setSwappingId(currentProductId);
    try {
      const res = await authFetch('/api/cart/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentProductId, replacementProductId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`✨ SmartCart Optimized! Saved ₹${savings.toFixed(2)} on this replacement.`);
        fetchCartAndData();
      } else {
        showToast(data.message || 'Error swapping item');
      }
    } catch {
      showToast('Failed to optimize cart item');
    } finally {
      setSwappingId(null);
    }
  };

  // Coupon application handler
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'SAVE10') {
      setAppliedCoupon({ code: 'SAVE10', discountPercent: 10, label: '10% Off Applied' });
      showToast('🎉 Coupon SAVE10 applied! 10% discount added.');
    } else if (code === 'WELCOME50') {
      setAppliedCoupon({ code: 'WELCOME50', flatDiscount: 50, label: '₹50 Welcome Off' });
      showToast('🎉 Coupon WELCOME50 applied! ₹50 discount added.');
    } else if (code === 'SPIN15') {
      setAppliedCoupon({ code: 'SPIN15', discountPercent: 15, label: '15% Spin Reward Off' });
      showToast('🎉 Spin-the-Wheel Coupon SPIN15 applied! 15% discount added.');
    } else if (code === 'MEGA20') {
      setAppliedCoupon({ code: 'MEGA20', discountPercent: 20, label: '20% Mega Saver Off' });
      showToast('🎉 Coupon MEGA20 applied! 20% discount added.');
    } else if (code === 'LUCKY150') {
      setAppliedCoupon({ code: 'LUCKY150', flatDiscount: 150, label: '₹150 Lucky Spin Off' });
      showToast('🎉 Coupon LUCKY150 applied! ₹150 discount added.');
    } else if (code === 'FREESHIP') {
      setAppliedCoupon({ code: 'FREESHIP', freeShipping: true, label: 'Free Express Delivery' });
      showToast('🎉 Coupon FREESHIP applied! Free Delivery unlocked.');
    } else {
      // Check if user has this coupon in their claimedCoupons
      const userCoupon = (user?.claimedCoupons || []).find((c) => c.code.toUpperCase() === code);
      if (userCoupon) {
        if (userCoupon.discountType === 'percent') {
          setAppliedCoupon({ code: userCoupon.code, discountPercent: userCoupon.discountValue, label: `${userCoupon.discountValue}% Off Applied` });
        } else if (userCoupon.discountType === 'flat') {
          setAppliedCoupon({ code: userCoupon.code, flatDiscount: userCoupon.discountValue, label: `₹${userCoupon.discountValue} Off Applied` });
        } else {
          setAppliedCoupon({ code: userCoupon.code, freeShipping: true, label: 'Free Delivery Applied' });
        }
        showToast(`🎉 Claimed Reward Coupon ${userCoupon.code} applied!`);
      } else {
        setCouponError('Invalid coupon. Try SAVE10, SPIN15, FREESHIP, or spin the wheel!');
      }
    }
  };

  const handleAddRecommended = async (productId) => {
    setAddingRecId(productId);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) {
        showToast('🛍️ Added to Cart!');
        fetchCartAndData();
      }
    } catch {
      showToast('Error adding item to cart');
    } finally {
      setAddingRecId(null);
    }
  };

  const handleProceedToCheckout = () => {
    // 🌟 Stock Availability Validation before heading to delivery & payment
    const outOfStockItems = cart.filter(
      (i) => i && i.product && i.product.quantity !== undefined && i.product.quantity <= 0
    );
    if (outOfStockItems.length > 0) {
      showToast('❌ Some items in your bag are out of stock. Please remove them before checkout.');
      return;
    }

    const insufficientStockItems = cart.filter(
      (i) => i && i.product && i.product.quantity !== undefined && i.product.quantity > 0 && i.quantity > i.product.quantity
    );
    if (insufficientStockItems.length > 0) {
      showToast('❌ One or more items exceed our available stock. Please reduce the quantity.');
      return;
    }

    navigate('/checkout');
  };

  // Calculations (on valid cart items only)
  const validCart = cart.filter((i) => i && i.product && i.product._id);

  const mrpTotal = validCart.reduce((sum, item) => {
    const p = item.product;
    return sum + (p.productPrice || 0) * item.quantity;
  }, 0);

  const subtotal = validCart.reduce((sum, item) => {
    const p = item.product;
    const price = p.discount > 0
      ? p.productPrice * (1 - p.discount / 100)
      : p.productPrice || 0;
    return sum + price * item.quantity;
  }, 0);

  const productSavings = Math.max(0, mrpTotal - subtotal);

  // Coupon discount calculation
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercent) {
      couponDiscount = (subtotal * appliedCoupon.discountPercent) / 100;
    } else if (appliedCoupon.flatDiscount) {
      couponDiscount = Math.min(appliedCoupon.flatDiscount, subtotal);
    }
  }

  const finalTotal = Math.max(0, subtotal - couponDiscount);
  const totalItems = validCart.reduce((s, i) => s + (i.quantity || 1), 0);

  // Budget calculations
  const budget = budgetInfo.budget || 0;
  const spentSoFar = budgetInfo.spent || 0;
  const projectedRemaining = budget > 0 ? budget - (spentSoFar + finalTotal) : 0;
  const isOverBudget = budget > 0 && projectedRemaining < 0;

  // Stock validity check (only block if legitimately 0 stock or quantity > stock)
  const hasOutOfStock = validCart.some(
    (i) => i.product.quantity !== undefined && i.product.quantity <= 0
  );
  const hasExceededStock = validCart.some(
    (i) => i.product.quantity !== undefined && i.product.quantity > 0 && i.quantity > i.product.quantity
  );
  const isCheckoutDisabled = checkingOut || hasOutOfStock || hasExceededStock || validCart.length === 0;

  if (loading) {
    return (
      <div className="cart-page-wrapper">
        <div className="shop-loader" style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div className="shop-spinner" style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <span style={{ fontWeight: 600, color: '#64748b' }}>Loading your shopping bag...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper">
      {/* ─── 1. TOP SAGE-MINT PASTEL HERO BANNER (MATCHING REFERENCE THEME) ─── */}
      <section className="cart-banner-card">
        <div className="cart-banner-content">
          <div className="cart-breadcrumb-chip">
            Home • Shopping Bag
          </div>
          <h1 className="cart-banner-title">
            My Shopping Bag
          </h1>
          <div className="cart-banner-subtitle">
            {totalItems > 0
              ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'} in your bag • Free delivery on all orders`
              : 'Your bag is ready for new finds'}
          </div>

          {/* Stepper Progress Bar */}
          <div className="cart-steps-pill-bar">
            <div className="cart-step-item active">
              <span>🛍️</span> 1. Bag Review
            </div>
            <span className="cart-step-divider">➔</span>
            <div className="cart-step-item">
              <span>🚚</span> 2. Delivery Address
            </div>
            <span className="cart-step-divider">➔</span>
            <div className="cart-step-item">
              <span>💳</span> 3. Payment
            </div>
          </div>
        </div>

        {/* Right badges */}
        <div className="cart-banner-artwork">
          <div className="cart-trust-badges-pill">
            <span className="cart-trust-badge">📦 Free Express Delivery</span>
            <span className="cart-trust-badge">⚡ Instant Dispatch</span>
            <span className="cart-trust-badge">🔒 256-Bit SSL Protection</span>
          </div>
        </div>
      </section>

      {/* ─── 2. EMPTY STATE ─── */}
      {cart.length === 0 ? (
        <div className="cart-empty-wrapper">
          <div className="cart-empty-graphic">
            🛍️
          </div>
          <h2>Your shopping bag is empty</h2>
          <p>
            Looks like you haven't added anything to your cart yet. Explore our curated collections across fashion, electronics, and home essentials.
          </p>
          <Link to="/products" className="cart-empty-cta-btn">
            Explore Catalogue →
          </Link>

          <div className="cart-empty-categories-row">
            <div className="cart-empty-categories-label">Browse by Popular Categories</div>
            <div className="cart-empty-pills">
              <Link to="/products?category=Beauty" className="cart-empty-cat-pill">💄 Beauty &amp; Fragrances</Link>
              <Link to="/products?category=Electronics" className="cart-empty-cat-pill">💻 Electronics</Link>
              <Link to="/products?category=Kitchen" className="cart-empty-cat-pill">🍳 Kitchen &amp; Dining</Link>
              <Link to="/products?category=Clothing" className="cart-empty-cat-pill">👕 Clothing</Link>
              <Link to="/products?category=Footwear" className="cart-empty-cat-pill">👟 Footwear</Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ─── FREE DELIVERY PROGRESS BAR ─── */}
          <FreeDeliveryBar currentAmount={subtotal} threshold={1000} />

          {/* ─── 3. BUDGET MONITOR ALERT (IF SET) ─── */}
          {budget > 0 && (
            <div className={`cart-budget-alert-card ${isOverBudget ? 'exceeded' : 'ok'}`}>
              <div className="budget-alert-top">
                <div className="budget-alert-left">
                  <span className="budget-alert-icon">{isOverBudget ? '⚠️' : '🎯'}</span>
                  <div>
                    <div className="budget-alert-heading">
                      {isOverBudget
                        ? `Monthly Budget Exceeded by ₹${Math.abs(projectedRemaining).toFixed(0)}!`
                        : `Within Budget: ₹${projectedRemaining.toFixed(0)} will remain after checkout.`}
                    </div>
                    <div className="budget-alert-sub">
                      Monthly Limit: ₹{budget.toLocaleString()} • Spent Previously: ₹{spentSoFar.toLocaleString()} • Current Order: ₹{finalTotal.toFixed(0)}
                    </div>
                  </div>
                </div>

                <span className={`budget-remaining-pill ${isOverBudget ? 'exceeded' : 'ok'}`}>
                  {isOverBudget ? 'Over Budget' : `₹${projectedRemaining.toFixed(0)} Remaining`}
                </span>
              </div>

              <div className="budget-progress-track">
                <div
                  className={`budget-progress-fill ${isOverBudget ? 'exceeded' : 'ok'}`}
                  style={{ width: `${Math.min(100, Math.round(((spentSoFar + finalTotal) / budget) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* ─── 4. SMARTCART OPTIMIZATION CARD ─── */}
          {optimizerSuggestions.length > 0 && (
            <div className="cart-optimizer-card">
              <div className="optimizer-header-row">
                <div className="optimizer-brand-tag">
                  <span>✨</span>
                  <span>SmartCart Optimization Available</span>
                </div>
                <span className="optimizer-savings-pill">
                  Potential Savings: ₹
                  {optimizerSuggestions.reduce((sum, s) => sum + s.savings, 0).toFixed(0)}
                </span>
              </div>
              <p className="optimizer-desc-text">
                We found cheaper alternatives in stock for items in your cart. Swap with 1-click to reduce your total amount!
              </p>

              <div className="optimizer-items-stack">
                {optimizerSuggestions.map((s) => (
                  <div key={s.suggestedProduct._id} className="optimizer-item-row">
                    <div className="swap-products-comparison">
                      <span className="swap-original-title">{s.currentProduct.productName}</span>
                      <span className="swap-arrow-icon">➔</span>
                      <span className="swap-target-title">{s.suggestedProduct.productName}</span>
                    </div>

                    <div className="swap-controls-right">
                      <span className="swap-savings-amount">Save ₹{s.savings.toFixed(0)}</span>
                      <button
                        type="button"
                        className="swap-action-btn"
                        disabled={swappingId === s.currentProduct._id}
                        onClick={() =>
                          handleSwapItem(
                            s.currentProduct._id,
                            s.suggestedProduct._id,
                            s.savings
                          )
                        }
                      >
                        {swappingId === s.currentProduct._id ? 'Swapping...' : '✨ Swap Item'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── 5. MAIN CART 2-COLUMN LAYOUT ─── */}
          <div className="cart-main-grid">
            {/* Left: Cart Items Column */}
            <div className="cart-items-section">
              <div className="cart-items-count-header">
                <h3>Items in Your Bag ({totalItems})</h3>
                <Link to="/products" className="cart-clear-or-continue">
                  ← Continue Shopping
                </Link>
              </div>

              {cart.map((item) => {
                const p = item.product;
                if (!p) return null;

                const hasDiscount = p.discount > 0;
                const price = hasDiscount
                  ? parseFloat((p.productPrice * (1 - p.discount / 100)).toFixed(2))
                  : p.productPrice;

                const isOutOfStock = p.quantity === 0;
                const isStockLimited = p.quantity > 0 && item.quantity > p.quantity;
                const isLowStock = p.quantity > 0 && p.quantity < 5;

                const catLower = (p.category || '').toLowerCase();

                return (
                  <div
                    key={item._id}
                    className={`cart-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                  >
                    {/* Thumbnail */}
                    <div className="cart-thumb-box">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.productName} />
                      ) : (
                        <div className="cart-thumb-placeholder">📦</div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="cart-details-box">
                      <span className={`cart-category-chip ${catLower}`}>
                        {p.category || 'General'}
                      </span>
                      <h4 className="cart-item-title" title={p.productName}>
                        {p.productName}
                      </h4>

                      <div className="cart-item-pricing-row">
                        <span className="cart-unit-price">₹{price.toLocaleString()}</span>
                        {hasDiscount && (
                          <>
                            <span className="cart-original-price">₹{p.productPrice?.toLocaleString()}</span>
                            <span className="cart-discount-pill">{p.discount}% OFF</span>
                          </>
                        )}
                      </div>

                      {/* Stock Status Badge */}
                      {isOutOfStock ? (
                        <span className="cart-stock-status out">
                          ❌ Out of Stock. Remove item to checkout.
                        </span>
                      ) : isStockLimited ? (
                        <span className="cart-stock-status low">
                          ⚠️ Only {p.quantity} available in stock.
                        </span>
                      ) : isLowStock ? (
                        <span className="cart-stock-status low">
                          ⚠️ Only {p.quantity} left in stock!
                        </span>
                      ) : (
                        <span className="cart-stock-status in">
                          ✓ In Stock &amp; Ready to Ship
                        </span>
                      )}
                    </div>

                    {/* Stepper & Line Total */}
                    <div className="cart-stepper-and-total">
                      <div className="cart-qty-pill">
                        <button
                          type="button"
                          className="cart-qty-btn"
                          onClick={() => updateQty(p._id, item.quantity - 1)}
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="cart-qty-number">{item.quantity}</span>
                        <button
                          type="button"
                          className="cart-qty-btn"
                          disabled={item.quantity >= p.quantity}
                          onClick={() => updateQty(p._id, item.quantity + 1)}
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-item-total-block">
                        <div className="cart-item-total-amount">
                          ₹{(price * item.quantity).toLocaleString()}
                        </div>
                        <div className="cart-item-actions-row">
                          <button
                            type="button"
                            className="cart-action-icon-btn wishlist-btn"
                            onClick={() => moveToWishlist(p)}
                            title="Move to Wishlist"
                          >
                            ❤️
                          </button>
                          <button
                            type="button"
                            className="cart-action-icon-btn"
                            onClick={() => removeItem(p._id)}
                            title="Remove from Cart"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Order Summary Sidebar */}
            <aside className="cart-summary-sidebar">
              <div className="cart-summary-card">
                <div className="cart-summary-header">
                  <h3>Order Summary</h3>
                  <span className="cart-items-tag">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                </div>

                {/* Promo Coupon Form */}
                <div className="cart-coupon-box">
                  <span className="cart-coupon-label">Promotional Code</span>
                  <form onSubmit={handleApplyCoupon} className="cart-coupon-input-group">
                    <input
                      type="text"
                      className="cart-coupon-input"
                      placeholder="e.g. SAVE10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button type="submit" className="cart-coupon-apply-btn">
                      Apply
                    </button>
                  </form>
                  {couponError && (
                    <div style={{ color: '#dc2626', fontSize: '0.76rem', marginTop: '4px', fontWeight: 600 }}>
                      {couponError}
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="cart-coupon-applied-note">
                      ✓ {appliedCoupon.label} (Save ₹{couponDiscount.toFixed(0)})
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="cart-breakdown-list">
                  <div className="cart-breakdown-row">
                    <span>Total MRP</span>
                    <span>₹{mrpTotal.toLocaleString()}</span>
                  </div>

                  {productSavings > 0 && (
                    <div className="cart-breakdown-row discount-row">
                      <span>Product Discount</span>
                      <span>−₹{productSavings.toLocaleString()}</span>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="cart-breakdown-row discount-row">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span>−₹{couponDiscount.toFixed(0)}</span>
                    </div>
                  )}

                  <div className="cart-breakdown-row">
                    <span>Delivery Charges</span>
                    <span className="cart-free-tag">FREE</span>
                  </div>

                  <div className="cart-breakdown-row">
                    <span>Estimated Tax</span>
                    <span style={{ color: '#64748b', fontSize: '0.84rem' }}>Included</span>
                  </div>
                </div>

                <div className="cart-summary-divider" />

                <div className="cart-total-row">
                  <span className="cart-total-label">Total Amount</span>
                  <span className="cart-total-value">₹{finalTotal.toLocaleString()}</span>
                </div>

                {hasOutOfStock && (
                  <div className="cart-stock-blocker-warning">
                    ⚠️ Cannot place order: One or more items in your cart are currently out of stock.
                  </div>
                )}
                {hasExceededStock && (
                  <div className="cart-stock-blocker-warning">
                    ⚠️ Cannot place order: One or more items exceed our available stock.
                  </div>
                )}

                <button
                  type="button"
                  className="cart-checkout-main-btn"
                  onClick={handleProceedToCheckout}
                  disabled={isCheckoutDisabled}
                  title={isCheckoutDisabled ? 'Resolve stock warnings to proceed' : 'Proceed to Checkout'}
                >
                  <span>Proceed to Checkout</span>
                  <span>→</span>
                </button>

                {/* Trust Guarantees */}
                <div className="cart-guarantee-grid">
                  <div className="cart-guarantee-item">
                    <span className="cart-guarantee-icon">🔒</span>
                    <span>256-Bit SSL Secure</span>
                  </div>
                  <div className="cart-guarantee-item">
                    <span className="cart-guarantee-icon">🚚</span>
                    <span>Free Fast Delivery</span>
                  </div>
                  <div className="cart-guarantee-item">
                    <span className="cart-guarantee-icon">🔄</span>
                    <span>30-Day Easy Returns</span>
                  </div>
                  <div className="cart-guarantee-item">
                    <span className="cart-guarantee-icon">🛡️</span>
                    <span>100% Authentic</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}

      {/* ─── 6. BOTTOM RECOMMENDED PRODUCTS ("YOU MAY ALSO LIKE") ─── */}
      {recommended.length > 0 && (
        <section className="cart-recommendations-section">
          <div className="cart-rec-header">
            <h3 className="cart-rec-title">You May Also Like</h3>
            <Link to="/products" className="cart-rec-view-all">
              View All Products →
            </Link>
          </div>

          <div className="cart-rec-grid">
            {recommended.map((item) => (
              <div key={item._id} className="cart-rec-card">
                <div className="cart-rec-img-wrap">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <div className="cart-rec-info">
                  <span className="cart-rec-cat">{item.category}</span>
                  <h4 className="cart-rec-name" title={item.productName}>
                    {item.productName}
                  </h4>
                  <div className="cart-rec-price-row">
                    <span className="cart-rec-price">
                      ₹{item.productPrice?.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      className="cart-rec-add-btn"
                      disabled={addingRecId === item._id}
                      onClick={() => handleAddRecommended(item._id)}
                    >
                      {addingRecId === item._id ? 'Adding...' : '+ Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Toast message={toast} />
    </div>
  );
}
