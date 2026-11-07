import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';
import './Dashboard.css';

export default function Dashboard() {
  const { user, authFetch, setCartCount } = useAuth();
  const { toast, showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetRecommendations, setBudgetRecommendations] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [restockList, setRestockList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Electronics');

  // Load all dashboard information
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, budgetRes, recentRes, recRes, actRes, restockRes] = await Promise.all([
        authFetch('/api/personal/dashboard'),
        authFetch('/api/smart/budget-recommendations'),
        authFetch('/api/personal/recently-viewed'),
        authFetch('/api/personal/recommendations'),
        authFetch('/api/personal/activity'),
        authFetch('/api/personal/restock-notify'),
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setDashboardData(d.dashboard);
        setBudgetInput(d.dashboard?.budget || 0);
      }
      if (budgetRes.ok) {
        const b = await budgetRes.json();
        setBudgetRecommendations(b.recommendations || []);
      }
      if (recentRes.ok) {
        const r = await recentRes.json();
        setRecentlyViewed(r.recentlyViewed || []);
      }
      if (recRes.ok) {
        const rc = await recRes.json();
        setRecommendations(rc.recommendations || []);
      }
      if (actRes.ok) {
        const a = await actRes.json();
        setActivityHistory(a.activityHistory || []);
      }
      if (restockRes.ok) {
        const rs = await restockRes.json();
        setRestockList(rs.restockNotifications || []);
      }
    } catch {
      showToast('Error loading personalized dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Update budget
  const handleSaveBudget = async () => {
    const val = Number(budgetInput);
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid positive number for your budget');
      return;
    }
    try {
      const res = await authFetch('/api/smart/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: val }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('🎯 Budget updated successfully!');
        setIsEditingBudget(false);
        loadDashboard();
      } else {
        showToast(data.message || 'Error updating budget');
      }
    } catch {
      showToast('Failed to update budget');
    }
  };

  // Add to cart from dashboard
  const handleAddToCart = async (productId) => {
    try {
      const res = await authFetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        setCartCount(data.cart.reduce((sum, i) => sum + i.quantity, 0));
        showToast('🛍️ Added to bag!');
      } else {
        showToast(data.message || 'Failed to add to bag');
      }
    } catch {
      showToast('Error adding item to bag');
    }
  };

  // Unsubscribe restock
  const handleUnsubscribeRestock = async (productId) => {
    try {
      const res = await authFetch(`/api/personal/restock-notify/${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRestockList((prev) => prev.filter((p) => p._id !== productId));
        showToast('Removed from restock alerts');
      }
    } catch {
      showToast('Error updating restock alerts');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="shop-loader" style={{ minHeight: '65vh' }}>
        <div className="shop-spinner"></div>
        <span>Preparing your personal shopping dashboard...</span>
      </div>
    );
  }

  const budget = dashboardData?.budget || 0;
  const totalSpent = dashboardData?.totalSpent || 0;
  const remaining = dashboardData?.budgetRemaining || 0;
  const budgetPercent = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;
  const isBudgetExceeded = budget > 0 && remaining < 0;

  // Categories matching the reference screenshot design
  const categoryTiles = [
    { name: 'Electronics', icon: '💻' },
    { name: 'Clothing', icon: '👕' },
    { name: 'Footwear', icon: '👟' },
    { name: 'Accessories', icon: '👜' },
    { name: 'Kitchen', icon: '🍳' },
    { name: 'Sports', icon: '⚽' },
    { name: 'Books', icon: '📚' },
    { name: 'Wellness', icon: '🌿' },
  ];

  return (
    <div className="dash-page-wrapper">
      {/* ── 1. Sage-Mint Hero Banner (Matching Reference Image) ── */}
      <section className="dash-banner-card">
        <div className="dash-banner-content">
          <h1 className="dash-banner-title">
            Personalized dashboard
          </h1>
          <div className="dash-banner-subtitle">
            shopping with joy
          </div>

          <form onSubmit={handleSearchSubmit} className="dash-banner-search">
            <span className="dash-search-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search products, brands and deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right Art Graphic */}
        <div className="dash-banner-artwork">
          <div className="artwork-illustration-box">
            <span className="artwork-main-emoji">🛍️</span>
            <div className="artwork-sub-badges">
              <span className="art-badge">⭐ 4.9 Rating</span>
              <span className="art-badge">⚡ Instant Dispatch</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Quick Stat Chips ── */}
      <section className="dash-stats-strip">
        <Link to="/orders" className="dash-stat-pill">
          <div className="dash-stat-icon-wrap icon-emerald">📦</div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{dashboardData?.totalOrders || 0}</span>
            <span className="dash-stat-label">Orders Placed</span>
          </div>
        </Link>

        <Link to="/cart" className="dash-stat-pill">
          <div className="dash-stat-icon-wrap icon-blue">🛍️</div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{dashboardData?.cartCount || 0}</span>
            <span className="dash-stat-label">Items in Bag</span>
          </div>
        </Link>

        <Link to="/wishlist" className="dash-stat-pill">
          <div className="dash-stat-icon-wrap icon-purple">🤍</div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{dashboardData?.wishlistCount || 0}</span>
            <span className="dash-stat-label">Wishlisted Items</span>
          </div>
        </Link>

        <div className="dash-stat-pill">
          <div className="dash-stat-icon-wrap icon-amber">💰</div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">₹{remaining.toLocaleString()}</span>
            <span className="dash-stat-label">Safe Budget Remaining</span>
          </div>
        </div>
      </section>

      {/* ── 3. Select Categories (Matching Reference Image) ── */}
      <section>
        <div className="dash-section-row">
          <h2 className="dash-section-title">Select Categories</h2>
          <Link to="/products" className="dash-show-all-link">Show All</Link>
        </div>

        <div className="dash-categories-scroll">
          {categoryTiles.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <Link
                key={cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                onClick={() => setActiveCategory(cat.name)}
                className={`dash-category-card ${isActive ? 'active-card' : ''}`}
              >
                <span className="dash-category-icon">{cat.icon}</span>
                <span className="dash-category-name">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 4. Most Popular / Curated Recommendations (Matching Reference Image) ── */}
      {recommendations.length > 0 && (
        <section>
          <div className="dash-section-row">
            <h2 className="dash-section-title">Most Popular</h2>
            <Link to="/products" className="dash-show-all-link">Show All</Link>
          </div>

          <div className="dash-products-grid">
            {recommendations.slice(0, 4).map((p) => {
              const hasDiscount = p.discount > 0;
              const finalPrice = hasDiscount ? p.discountedPrice : p.productPrice;

              return (
                <div key={p._id} className="dash-product-card">
                  <div className="dash-product-image-box">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.productName} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>📦</span>
                    )}
                    {hasDiscount && (
                      <span className="dash-discount-ribbon">-{p.discount}%</span>
                    )}
                  </div>

                  <div className="dash-product-body">
                    <span className="dash-product-category">{p.category}</span>
                    <h3 className="dash-product-title" title={p.productName}>
                      {p.productName}
                    </h3>

                    <div className="dash-product-footer">
                      <div className="dash-price-group">
                        <span className="dash-price-current">₹{finalPrice?.toLocaleString()}</span>
                        {hasDiscount && (
                          <span className="dash-price-original">₹{p.productPrice?.toLocaleString()}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="dash-add-cart-btn"
                        onClick={() => handleAddToCart(p._id)}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 5. Monthly Shopping Budget Tracker Card ── */}
      <section className="dash-budget-card">
        <div className="dash-budget-top">
          <div>
            <span className="dash-budget-badge">Personal Finance Assistant</span>
            <h2 className="dash-budget-title">Monthly Shopping Budget Tracker</h2>
          </div>

          {!isEditingBudget ? (
            <button
              type="button"
              className="dash-budget-btn"
              onClick={() => setIsEditingBudget(true)}
            >
              ✏️ {budget > 0 ? 'Adjust Budget' : 'Set Budget'}
            </button>
          ) : (
            <div className="dash-budget-edit-bar">
              <input
                type="number"
                className="dash-budget-input"
                placeholder="₹ e.g. 10000"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                min="0"
              />
              <button type="button" className="dash-budget-save-btn" onClick={handleSaveBudget}>
                Save
              </button>
              <button
                type="button"
                className="dash-budget-cancel-btn"
                onClick={() => setIsEditingBudget(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="dash-budget-metrics">
          <div className="budget-metric-box">
            <span className="metric-title">Set Monthly Budget</span>
            <span className="metric-amount">₹{budget.toLocaleString()}</span>
          </div>

          <div className="budget-metric-box">
            <span className="metric-title">Spent So Far</span>
            <span className="metric-amount">₹{totalSpent.toLocaleString()}</span>
          </div>

          <div className="budget-metric-box">
            <span className="metric-title">Safe Remaining Balance</span>
            <span className={`metric-amount ${isBudgetExceeded ? 'red' : 'green'}`}>
              ₹{remaining.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="dash-progress-track">
          <div
            className={`dash-progress-fill ${isBudgetExceeded ? 'fill-exceeded' : ''}`}
            style={{ width: `${Math.min(100, budgetPercent)}%` }}
          ></div>
        </div>

        <div className="dash-progress-footnote">
          <span>{budgetPercent}% of your monthly budget used</span>
          <span>{isBudgetExceeded ? '⚠️ Over Budget' : '✅ Within Safe Limits'}</span>
        </div>
      </section>

      {/* ── 6. Budget-Friendly Recommendations (Under Safe Limit) ── */}
      {budgetRecommendations.length > 0 && (
        <section>
          <div className="dash-section-row">
            <div>
              <h2 className="dash-section-title">Budget-Friendly Picks</h2>
              <span className="shop-section-sub">Carefully selected to fit within your remaining balance</span>
            </div>
            <Link to="/products" className="dash-show-all-link">Show All</Link>
          </div>

          <div className="dash-products-grid">
            {budgetRecommendations.slice(0, 4).map((p) => {
              const hasDiscount = p.discount > 0;
              const finalPrice = hasDiscount ? p.discountedPrice : p.productPrice;

              return (
                <div key={p._id} className="dash-product-card">
                  <div className="dash-product-image-box">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.productName} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>📦</span>
                    )}
                    {hasDiscount && (
                      <span className="dash-discount-ribbon">-{p.discount}%</span>
                    )}
                  </div>

                  <div className="dash-product-body">
                    <span className="dash-product-category">{p.category}</span>
                    <h3 className="dash-product-title" title={p.productName}>
                      {p.productName}
                    </h3>

                    <div className="dash-product-footer">
                      <div className="dash-price-group">
                        <span className="dash-price-current">₹{finalPrice?.toLocaleString()}</span>
                        {hasDiscount && (
                          <span className="dash-price-original">₹{p.productPrice?.toLocaleString()}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="dash-add-cart-btn"
                        onClick={() => handleAddToCart(p._id)}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 7. Split Subcards: Restock Subscriptions & Recent Activity ── */}
      <section className="dash-dual-grid">
        {/* Restock Notifications */}
        <div className="dash-subcard">
          <h3 className="dash-subcard-title">
            <span>🔔</span> Restock Notifications
          </h3>

          {restockList.length === 0 ? (
            <div className="dash-empty-note">
              No restock alerts set. When an out-of-stock item arrives, we'll notify you here!
            </div>
          ) : (
            <div className="dash-restock-list">
              {restockList.map((p) => (
                <div key={p._id} className="dash-restock-row">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.productName} className="dash-restock-thumb" />
                  ) : (
                    <div className="dash-restock-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                  )}

                  <div className="dash-restock-details">
                    <div className="dash-restock-name">{p.productName}</div>
                    <div className="dash-restock-tag">
                      {p.quantity > 0 ? '🎉 Restocked!' : '⏳ Still tracking'}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="dash-unsub-btn"
                    onClick={() => handleUnsubscribeRestock(p._id)}
                    title="Remove alert"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Shopping Activity */}
        <div className="dash-subcard">
          <h3 className="dash-subcard-title">
            <span>⚡</span> Recent Activity
          </h3>

          {activityHistory.length === 0 ? (
            <div className="dash-empty-note">
              Your recent shopping interactions will appear here.
            </div>
          ) : (
            <div className="dash-activity-list">
              {activityHistory.slice(0, 5).map((act, i) => (
                <div key={i} className="dash-activity-row">
                  <div className="dash-activity-icon">
                    {act.action === 'placed_order' ? '🎉' : act.action === 'added_to_cart' ? '🛍️' : '👁️'}
                  </div>
                  <div className="dash-activity-desc">
                    {act.details || act.action?.replace('_', ' ')}
                  </div>
                  <span className="dash-activity-time">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Toast message={toast} />
    </div>
  );
}
