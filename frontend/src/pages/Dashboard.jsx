import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';

export default function Dashboard() {
  const { user, token, authFetch, setCartCount } = useAuth();
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetRecommendations, setBudgetRecommendations] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [restockList, setRestockList] = useState([]);

  // Fetch all dashboard data
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
        showToast('🎯 Shopping budget successfully updated!');
        setIsEditingBudget(false);
        // Refresh dashboard recommendations
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

  if (loading) {
    return (
      <div className="myntra-loader" style={{ minHeight: '60vh' }}>
        <div className="myntra-spinner"></div>
        <span>Preparing your personalized shopping dashboard...</span>
      </div>
    );
  }

  const budget = dashboardData?.budget || 0;
  const totalSpent = dashboardData?.totalSpent || 0;
  const remaining = dashboardData?.budgetRemaining || 0;
  const budgetPercent = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;
  const isBudgetExceeded = budget > 0 && remaining < 0;

  return (
    <div className="dashboard-container">
      {/* Top Welcome Banner */}
      <div className="dashboard-hero-card">
        <div className="dashboard-hero-left">
          <div className="hero-avatar">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="hero-badge">SmartCart Intelligence Center</div>
            <h1 className="hero-title">Welcome back, {user?.username}!</h1>
            <p className="hero-subtitle">
              Here is your personalized shopping overview, budget tracker &amp; tailored recommendations.
            </p>
          </div>
        </div>

        {/* Quick stat counters */}
        <div className="dashboard-stat-row">
          <Link to="/orders" className="hero-stat-box">
            <span className="stat-num">{dashboardData?.totalOrders || 0}</span>
            <span className="stat-label">Orders Placed</span>
          </Link>
          <Link to="/cart" className="hero-stat-box">
            <span className="stat-num">{dashboardData?.cartCount || 0}</span>
            <span className="stat-label">In Your Bag</span>
          </Link>
          <Link to="/wishlist" className="hero-stat-box">
            <span className="stat-num">{dashboardData?.wishlistCount || 0}</span>
            <span className="stat-label">Wishlist Items</span>
          </Link>
        </div>
      </div>

      {/* ─── 1. BUDGET MONITORING SECTION ─── */}
      <div className="dashboard-section-card budget-monitor-card">
        <div className="budget-header-row">
          <div>
            <div className="section-pill">Feature 20 • Smart Financial Control</div>
            <h2 className="section-heading">💰 Monthly Shopping Budget Tracker</h2>
            <p className="section-desc">
              Set a limit to monitor your fashion expenses and get recommendations within your remaining balance.
            </p>
          </div>

          {!isEditingBudget ? (
            <button
              type="button"
              className="myntra-btn-outline"
              onClick={() => setIsEditingBudget(true)}
            >
              ✏️ {budget > 0 ? 'Adjust Budget' : 'Set Budget'}
            </button>
          ) : (
            <div className="budget-edit-controls">
              <input
                type="number"
                className="budget-input"
                placeholder="₹ e.g. 10000"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                min="0"
              />
              <button type="button" className="myntra-btn-primary" onClick={handleSaveBudget}>
                Save
              </button>
              <button
                type="button"
                className="myntra-btn-outline"
                onClick={() => setIsEditingBudget(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {budget === 0 ? (
          <div className="budget-empty-callout">
            <span>💡 You haven't set a shopping budget yet. Set one above to enable automatic overspend alerts and tailored recommendations!</span>
          </div>
        ) : (
          <div className="budget-progress-container">
            <div className="budget-metrics-grid">
              <div className="budget-metric">
                <span className="metric-label">Set Budget</span>
                <span className="metric-val">₹{budget.toLocaleString()}</span>
              </div>
              <div className="budget-metric">
                <span className="metric-label">Total Spent So Far</span>
                <span className="metric-val spent">₹{totalSpent.toLocaleString()}</span>
              </div>
              <div className="budget-metric">
                <span className="metric-label">Remaining Safe Budget</span>
                <span className={`metric-val ${isBudgetExceeded ? 'danger' : 'safe'}`}>
                  ₹{remaining.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="budget-bar-track">
              <div
                className={`budget-bar-fill ${isBudgetExceeded ? 'bar-exceeded' : budgetPercent > 75 ? 'bar-warning' : 'bar-normal'}`}
                style={{ width: `${Math.min(100, budgetPercent)}%` }}
              />
            </div>

            <div className="budget-bar-footer">
              <span>{budgetPercent}% of monthly budget spent</span>
              {isBudgetExceeded ? (
                <span className="budget-status-tag danger">⚠️ Budget Exceeded by ₹{Math.abs(remaining).toLocaleString()}</span>
              ) : (
                <span className="budget-status-tag safe">✅ On Track</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. BUDGET-FRIENDLY PICKS ─── */}
      {budget > 0 && remaining > 0 && budgetRecommendations.length > 0 && (
        <div className="dashboard-section-card">
          <div className="section-header-flex">
            <div>
              <div className="section-pill">Feature 21 • Smart Recommendations</div>
              <h2 className="section-heading">🎯 Budget-Friendly Picks (Under ₹{remaining.toLocaleString()})</h2>
              <p className="section-desc">
                High-value products carefully picked to fit within your remaining balance.
              </p>
            </div>
            <Link to="/products" className="dashboard-view-all">
              Explore All ›
            </Link>
          </div>

          <div className="dashboard-horizontal-shelf">
            {budgetRecommendations.map((p) => {
              const hasDiscount = p.discount > 0;
              const finalPrice = hasDiscount ? p.discountedPrice : p.productPrice;

              return (
                <div key={p._id} className="shelf-card">
                  <div className="shelf-img-box">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.productName} />
                    ) : (
                      <span>📦</span>
                    )}
                    {hasDiscount && (
                      <span className="shelf-discount">{p.discount}% OFF</span>
                    )}
                  </div>
                  <div className="shelf-details">
                    <div className="shelf-cat">{p.category}</div>
                    <div className="shelf-name" title={p.productName}>{p.productName}</div>
                    <div className="shelf-price-row">
                      <span className="shelf-price">₹{finalPrice?.toLocaleString()}</span>
                      {hasDiscount && (
                        <span className="shelf-old-price">₹{p.productPrice?.toLocaleString()}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="shelf-add-btn"
                      onClick={() => handleAddToCart(p._id)}
                    >
                      + Add to Bag
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 3. RECENTLY VIEWED PRODUCTS ─── */}
      {recentlyViewed.length > 0 && (
        <div className="dashboard-section-card">
          <div className="section-header-flex">
            <div>
              <div className="section-pill">Feature 25 • Personalization</div>
              <h2 className="section-heading">👀 Recently Viewed Products</h2>
              <p className="section-desc">Jump straight back into styles and products you were inspecting.</p>
            </div>
          </div>

          <div className="dashboard-horizontal-shelf">
            {recentlyViewed.map((item) => {
              const p = item.product;
              if (!p) return null;
              const hasDiscount = p.discount > 0;
              const finalPrice = hasDiscount ? p.discountedPrice : p.productPrice;

              return (
                <div key={item._id || p._id} className="shelf-card">
                  <div className="shelf-img-box">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.productName} />
                    ) : (
                      <span>📦</span>
                    )}
                    {p.quantity === 0 && (
                      <span className="shelf-soldout">Sold Out</span>
                    )}
                  </div>
                  <div className="shelf-details">
                    <div className="shelf-cat">{p.category}</div>
                    <div className="shelf-name" title={p.productName}>{p.productName}</div>
                    <div className="shelf-price-row">
                      <span className="shelf-price">₹{finalPrice?.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      className="shelf-add-btn"
                      disabled={p.quantity === 0}
                      onClick={() => handleAddToCart(p._id)}
                    >
                      {p.quantity === 0 ? 'Out of Stock' : '+ Add to Bag'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 4. PERSONALIZED RECOMMENDATIONS ─── */}
      {recommendations.length > 0 && (
        <div className="dashboard-section-card">
          <div className="section-header-flex">
            <div>
              <div className="section-pill">Feature 26 • Smart Personalization</div>
              <h2 className="section-heading">✨ Recommended Just For You</h2>
              <p className="section-desc">Top rated finds matched to your favorite categories and taste profile.</p>
            </div>
            <Link to="/products" className="dashboard-view-all">Browse More ›</Link>
          </div>

          <div className="dashboard-horizontal-shelf">
            {recommendations.map((p) => {
              const hasDiscount = p.discount > 0;
              const finalPrice = hasDiscount ? p.discountedPrice : p.productPrice;

              return (
                <div key={p._id} className="shelf-card">
                  <div className="shelf-img-box">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.productName} />
                    ) : (
                      <span>📦</span>
                    )}
                    {p.averageRating > 0 && (
                      <span className="shelf-rating">★ {p.averageRating}</span>
                    )}
                  </div>
                  <div className="shelf-details">
                    <div className="shelf-cat">{p.category}</div>
                    <div className="shelf-name" title={p.productName}>{p.productName}</div>
                    <div className="shelf-price-row">
                      <span className="shelf-price">₹{finalPrice?.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      className="shelf-add-btn"
                      onClick={() => handleAddToCart(p._id)}
                    >
                      + Add to Bag
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 5. TWO-COLUMN SPLIT: RESTOCK ALERTS & RECENT ACTIVITY ─── */}
      <div className="dashboard-two-col-grid">
        {/* Restock Notification Subscriptions */}
        <div className="dashboard-section-card">
          <div className="section-pill">Feature 31 • Stock Management</div>
          <h2 className="section-heading" style={{ fontSize: '1.25rem' }}>🔔 Restock Subscriptions</h2>
          <p className="section-desc">Products you've asked us to track for restock.</p>

          {restockList.length === 0 ? (
            <div className="empty-sub-block">
              <span style={{ fontSize: '2rem' }}>🔕</span>
              <p>No restock alerts set. When an item is out of stock, click "Notify Me" to get alerts here!</p>
            </div>
          ) : (
            <div className="restock-item-list">
              {restockList.map((p) => (
                <div key={p._id} className="restock-row">
                  <div className="restock-thumb">
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.productName} /> : '📦'}
                  </div>
                  <div className="restock-info">
                    <div className="restock-title">{p.productName}</div>
                    <div className="restock-status">
                      {p.quantity > 0 ? (
                        <span className="restock-badge in-stock">🎉 Restocked! ({p.quantity} available)</span>
                      ) : (
                        <span className="restock-badge pending">⏳ Still Out of Stock</span>
                      )}
                    </div>
                  </div>
                  <div className="restock-actions">
                    {p.quantity > 0 && (
                      <button
                        type="button"
                        className="myntra-btn-primary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleAddToCart(p._id)}
                      >
                        Buy Now
                      </button>
                    )}
                    <button
                      type="button"
                      className="remove-icon-btn"
                      title="Unsubscribe alert"
                      onClick={() => handleUnsubscribeRestock(p._id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shopping Activity History */}
        <div className="dashboard-section-card">
          <div className="section-pill">Feature 27 • Activity Log</div>
          <h2 className="section-heading" style={{ fontSize: '1.25rem' }}>📜 Shopping Activity History</h2>
          <p className="section-desc">Timeline of your recent actions on NOVA.</p>

          {activityHistory.length === 0 ? (
            <div className="empty-sub-block">
              <span style={{ fontSize: '2rem' }}>🕒</span>
              <p>No recent activity recorded yet. Browse products or add items to your cart to see your timeline!</p>
            </div>
          ) : (
            <div className="activity-timeline">
              {activityHistory.slice(0, 8).map((act, idx) => {
                let icon = '🛍️';
                if (act.action === 'placed_order') icon = '🎉';
                else if (act.action === 'added_to_wishlist') icon = '❤️';
                else if (act.action === 'viewed_product') icon = '👀';
                else if (act.action === 'optimized_cart') icon = '✨';

                return (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-icon-wrap">{icon}</div>
                    <div className="timeline-content">
                      <div className="timeline-desc">{act.details || act.productName || act.action}</div>
                      <div className="timeline-time">
                        {new Date(act.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}

