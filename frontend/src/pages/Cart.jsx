import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';

export default function Cart() {
  const { token, authFetch, setCartCount } = useAuth();
  const { toast, showToast } = useToast();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  // 🌟 Smart Cart Optimization state
  const [optimizerSuggestions, setOptimizerSuggestions] = useState([]);
  const [loadingOptimizer, setLoadingOptimizer] = useState(false);
  const [swappingId, setSwappingId] = useState(null);

  // 🌟 Budget Monitoring state
  const [budgetInfo, setBudgetInfo] = useState({ budget: 0, spent: 0, remaining: 0 });

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchCartAndData = async () => {
    setLoading(true);
    try {
      const [cartRes, budgetRes] = await Promise.all([
        fetch('/api/cart', { headers: authHeader }),
        authFetch('/api/smart/budget'),
      ]);

      if (cartRes.ok) {
        const data = await cartRes.json();
        setCart(data.cart || []);
        const count = (data.cart || []).reduce((s, i) => s + i.quantity, 0);
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
  }, []);

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

  const checkout = async () => {
    // 🌟 Stock Availability Validation
    const hasOutOfStock = cart.some((i) => !i.product || i.product.quantity === 0);
    if (hasOutOfStock) {
      showToast('❌ Some items in your bag are out of stock. Please remove them before checkout.');
      return;
    }

    const hasInsufficientStock = cart.some(
      (i) => i.product && i.product.quantity < i.quantity
    );
    if (hasInsufficientStock) {
      showToast('❌ One or more items exceed our available stock. Please reduce the quantity.');
      return;
    }

    setCheckingOut(true);
    const res = await fetch('/api/cart/checkout', { method: 'POST', headers: authHeader });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Order placed successfully! 🎉');
      fetchCartAndData();
    } else {
      showToast('❌ ' + data.message);
    }
    setCheckingOut(false);
  };

  const subtotal = cart.reduce((sum, item) => {
    const p = item.product;
    if (!p) return sum;
    const price = p.discount > 0
      ? p.productPrice * (1 - p.discount / 100)
      : p.productPrice || 0;
    return sum + price * item.quantity;
  }, 0);

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  // Budget calculations
  const budget = budgetInfo.budget || 0;
  const spentSoFar = budgetInfo.spent || 0;
  const projectedRemaining = budget > 0 ? budget - (spentSoFar + subtotal) : 0;
  const isOverBudget = budget > 0 && projectedRemaining < 0;

  // Stock validity check
  const hasInvalidStock = cart.some(
    (i) => !i.product || i.product.quantity === 0 || i.quantity > i.product.quantity
  );

  if (loading) {
    return (
      <div className="myntra-loader" style={{ minHeight: '60vh' }}>
        <div className="myntra-spinner"></div>
        <span>Loading your shopping bag...</span>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header-title-row">
        <h2>🛍️ My Shopping Bag ({totalItems} {totalItems === 1 ? 'item' : 'items'})</h2>
        <Link to="/products" className="continue-shopping-link">
          ← Continue Shopping
        </Link>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🛍️</div>
          <h3>Your shopping bag is empty</h3>
          <p>Explore our latest catalogue and discover amazing styles!</p>
          <Link to="/products" className="myntra-btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          {/* ─── 1. BUDGET MONITORING IN CART ─── */}
          {budget > 0 && (
            <div className={`cart-budget-alert ${isOverBudget ? 'alert-danger' : 'alert-success'}`}>
              <div className="budget-alert-header">
                <span className="budget-alert-icon">{isOverBudget ? '⚠️' : '🎯'}</span>
                <div>
                  <strong>
                    {isOverBudget
                      ? `Budget Alert: Bag exceeds monthly budget limit by ₹${Math.abs(projectedRemaining).toFixed(0)}!`
                      : `Within Budget: ₹${projectedRemaining.toFixed(0)} will remain after this order.`}
                  </strong>
                  <div className="budget-sub-note">
                    Set Budget: ₹{budget.toLocaleString()} • Previously Spent: ₹{spentSoFar.toLocaleString()} • Current Bag: ₹{subtotal.toFixed(0)}
                  </div>
                </div>
              </div>
              <div className="budget-mini-track">
                <div
                  className={`budget-mini-fill ${isOverBudget ? 'fill-exceeded' : 'fill-ok'}`}
                  style={{ width: `${Math.min(100, Math.round(((spentSoFar + subtotal) / budget) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* ─── 2. SMART CART OPTIMIZATION SECTION ─── */}
          {optimizerSuggestions.length > 0 && (
            <div className="cart-optimizer-box">
              <div className="optimizer-header">
                <div className="optimizer-title">
                  <span className="sparkle-icon">✨</span>
                  <span>SmartCart Optimization Available</span>
                </div>
                <span className="savings-badge">
                  Potential Savings: ₹
                  {optimizerSuggestions.reduce((sum, s) => sum + s.savings, 0).toFixed(0)}
                </span>
              </div>
              <p className="optimizer-desc">
                We found cheaper alternatives in stock for items in your cart. Swap with 1-click to reduce your total!
              </p>

              <div className="optimizer-list">
                {optimizerSuggestions.map((s) => (
                  <div key={s.suggestedProduct._id} className="optimizer-item-row">
                    <div className="swap-from-to">
                      <span className="swap-current">{s.currentProduct.productName}</span>
                      <span className="swap-arrow">➔</span>
                      <span className="swap-replacement">{s.suggestedProduct.productName}</span>
                    </div>
                    <div className="swap-actions">
                      <span className="swap-savings-tag">Save ₹{s.savings.toFixed(0)}</span>
                      <button
                        type="button"
                        className="swap-confirm-btn"
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

          {/* Main Cart Items List */}
          <div className="cart-layout-grid">
            <div className="cart-items-column">
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

                return (
                  <div className={`cart-item-card ${isOutOfStock ? 'item-out-of-stock' : ''}`} key={item._id}>
                    <div className="cart-item-img-wrap">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.productName} />
                      ) : (
                        <div className="cart-img-placeholder">📦</div>
                      )}
                    </div>

                    <div className="cart-item-info">
                      <div className="cart-item-brand">{p.category}</div>
                      <h4>{p.productName}</h4>

                      <div className="price-line">
                        <span className="effective-price">₹{price.toLocaleString()}</span>
                        {hasDiscount && (
                          <>
                            <span className="striked-price">₹{p.productPrice?.toLocaleString()}</span>
                            <span className="discount-tag">{p.discount}% OFF</span>
                          </>
                        )}
                      </div>

                      {/* Stock Alerts */}
                      {isOutOfStock ? (
                        <div className="stock-warning out">
                          ❌ Out of Stock. Please remove this item to place your order.
                        </div>
                      ) : isStockLimited ? (
                        <div className="stock-warning limited">
                          ⚠️ Only {p.quantity} available in stock. Please adjust quantity.
                        </div>
                      ) : isLowStock ? (
                        <div className="stock-warning low">
                          ⚠️ Only {p.quantity} left in stock!
                        </div>
                      ) : (
                        <div className="stock-ok">✅ In Stock</div>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="qty-control">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQty(p._id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        disabled={item.quantity >= p.quantity}
                        onClick={() => updateQty(p._id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="item-total-col">
                      <div className="item-total-price">
                        ₹{(price * item.quantity).toLocaleString()}
                      </div>
                      <button
                        type="button"
                        className="cart-remove-icon-btn"
                        onClick={() => removeItem(p._id)}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Summary Card */}
            <div className="cart-summary-column">
              <div className="cart-summary-card">
                <h3>Price Details ({totalItems} {totalItems === 1 ? 'Item' : 'Items'})</h3>

                <div className="summary-row">
                  <span>Total MRP</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>FREE</span>
                </div>
                <div className="summary-row">
                  <span>Convenience Fee</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>FREE</span>
                </div>

                <div className="summary-divider" />

                <div className="summary-row total-row">
                  <span>Total Amount</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>

                {hasInvalidStock && (
                  <div className="checkout-stock-alert">
                    ⚠️ Cannot place order: Please resolve out of stock items in your cart.
                  </div>
                )}

                <button
                  type="button"
                  className="myntra-btn-primary place-order-btn"
                  onClick={checkout}
                  disabled={checkingOut || hasInvalidStock}
                >
                  {checkingOut ? 'Placing Order...' : '🎉 PLACE ORDER'}
                </button>

                <div className="trust-badges-row">
                  <span>🔒 Safe &amp; Secure Payments</span>
                  <span>⚡ 100% Authentic Products</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Toast message={toast} />
    </div>
  );
}
