import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';
import SpinWheelModal from '../components/SpinWheelModal';
import StyleQuizModal from '../components/StyleQuizModal';
import './Profile.css';

export default function Profile() {
  const { user, token, authFetch, updateUser, logout, cartCount } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [spinModalOpen, setSpinModalOpen] = useState(false);
  const [styleQuizOpen, setStyleQuizOpen] = useState(false);

  // Sizing Profile state
  const [sizingData, setSizingData] = useState({
    height: 172,
    weight: 68,
    preferredFit: 'regular',
    topSize: 'M',
    bottomSize: '32',
    shoeSize: '9',
  });
  const [savingSizing, setSavingSizing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    username: user?.username || '',
    emailId: user?.emailId || '',
    phone: '',
    age: user?.age || '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    },
    budget: 0,
  });

  // Password change state
  const [pwdData, setPwdData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Account stats state
  const [stats, setStats] = useState({
    ordersCount: 0,
    wishlistCount: 0,
    cartCount: cartCount || 0,
    spent: 0,
    createdAt: null,
  });

  // Fetch full user profile details from backend
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [userRes, budgetRes] = await Promise.all([
        authFetch('/api/users/me'),
        authFetch('/api/smart/budget'),
      ]);

      if (userRes.ok) {
        const data = await userRes.json();
        const u = data.user;
        setFormData({
          username: u.username || '',
          emailId: u.emailId || '',
          phone: u.phone || '',
          age: u.age || '',
          address: {
            street: u.address?.street || '',
            city: u.address?.city || '',
            state: u.address?.state || '',
            postalCode: u.address?.postalCode || '',
            country: u.address?.country || 'India',
          },
          budget: u.budget || 0,
        });

        if (u.sizingProfile) {
          setSizingData({
            height: u.sizingProfile.height || 172,
            weight: u.sizingProfile.weight || 68,
            preferredFit: u.sizingProfile.preferredFit || 'regular',
            topSize: u.sizingProfile.topSize || 'M',
            bottomSize: u.sizingProfile.bottomSize || '32',
            shoeSize: u.sizingProfile.shoeSize || '9',
          });
        }

        setStats((prev) => ({
          ...prev,
          ordersCount: u.ordersCount || 0,
          wishlistCount: u.wishlistCount || 0,
          cartCount: u.cartCount || cartCount || 0,
          createdAt: u.createdAt,
        }));
      }

      if (budgetRes.ok) {
        const b = await budgetRes.json();
        setStats((prev) => ({
          ...prev,
          spent: b.spent || 0,
        }));
      }
    } catch {
      showToast('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Handle saving personal info or address or budget
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        username: formData.username.trim(),
        age: Number(formData.age) || undefined,
        phone: formData.phone.trim(),
        address: formData.address,
        budget: Number(formData.budget) || 0,
      };

      const res = await authFetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('✨ Profile updated successfully!');
        if (data.user) {
          updateUser(data.user);
        }
      } else {
        showToast(data.message || 'Failed to update profile');
      }
    } catch {
      showToast('Error saving profile changes');
    } finally {
      setSaving(false);
    }
  };

  // Handle Sizing Profile update
  const handleSaveSizing = async (e) => {
    e.preventDefault();
    setSavingSizing(true);
    try {
      const res = await authFetch('/api/personal/sizing-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sizingData),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('📏 Sizing profile updated! Fit predictor is calibrated.');
        updateUser({ sizingProfile: data.sizingProfile });
      } else {
        showToast(data.message || 'Failed to update sizing profile');
      }
    } catch {
      showToast('Error saving sizing profile');
    } finally {
      setSavingSizing(false);
    }
  };

  // Handle password update
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdData.newPassword) {
      showToast('Please enter a new password');
      return;
    }
    if (pwdData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      showToast('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdData.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('🔒 Password changed successfully!');
        setPwdData({ newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.message || 'Failed to update password');
      }
    } catch {
      showToast('Error updating password');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      '⚠️ Are you absolutely sure you want to permanently delete your account? All orders, cart items, and wishlist will be lost.'
    );
    if (!confirmation) return;

    try {
      const res = await authFetch('/api/users', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast('Account deleted successfully');
        logout();
        navigate('/register');
      } else {
        showToast(data.message || 'Failed to delete account');
      }
    } catch {
      showToast('Error deleting account');
    }
  };

  // Budget calculations
  const currentBudget = Number(formData.budget) || 0;
  const spent = stats.spent || 0;
  const remaining = currentBudget > 0 ? currentBudget - spent : 0;
  const isOverBudget = currentBudget > 0 && remaining < 0;
  const progressPercent = currentBudget > 0 ? Math.min(100, Math.round((spent / currentBudget) * 100)) : 0;

  const userInitial = (formData.username || user?.username || 'U').charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="profile-page-wrapper">
        <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <span style={{ fontWeight: 600, color: '#64748b' }}>Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-wrapper">
      {/* ─── 1. TOP SAGE-MINT PASTEL HERO BANNER ─── */}
      <section className="profile-banner-card">
        <div className="profile-banner-main">
          <div className="profile-avatar-circle">
            {userInitial}
          </div>

          <div className="profile-banner-text">
            <div className="profile-badge-chip">
              Verified Member
            </div>
            <h1 className="profile-banner-title">
              {formData.username || 'My Profile'}
            </h1>
            <div className="profile-banner-sub">
              <span>✉️ {formData.emailId}</span>
              {formData.phone && <span>• 📞 {formData.phone}</span>}
              {stats.createdAt && (
                <span>• 🗓️ Member since {new Date(stats.createdAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Stats Quick Links */}
        <div className="profile-banner-stats">
          <Link to="/cart" className="profile-stat-box" title="View Shopping Cart">
            <span className="profile-stat-icon">🛒</span>
            <span className="profile-stat-val">{stats.cartCount}</span>
            <span className="profile-stat-label">In Cart</span>
          </Link>

          <Link to="/wishlist" className="profile-stat-box" title="View Wishlist">
            <span className="profile-stat-icon">❤️</span>
            <span className="profile-stat-val">{stats.wishlistCount}</span>
            <span className="profile-stat-label">Wishlist</span>
          </Link>

          <Link to="/orders" className="profile-stat-box" title="View Orders">
            <span className="profile-stat-icon">📦</span>
            <span className="profile-stat-val">{stats.ordersCount}</span>
            <span className="profile-stat-label">Orders</span>
          </Link>
        </div>
      </section>

      {/* ─── 2. MAIN 2-COLUMN PROFILE CONTENT ─── */}
      <div className="profile-main-grid">
        {/* Left: Tab Navigation */}
        <aside className="profile-nav-card">
          <button
            type="button"
            className={`profile-nav-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <span className="nav-btn-icon-label">
              <span>👤</span> Personal Details
            </span>
            <span className="nav-arrow-indicator">›</span>
          </button>

          <button
            type="button"
            className={`profile-nav-btn ${activeTab === 'address' ? 'active' : ''}`}
            onClick={() => setActiveTab('address')}
          >
            <span className="nav-btn-icon-label">
              <span>📍</span> Delivery Address
            </span>
            <span className="nav-arrow-indicator">›</span>
          </button>

          <button
            type="button"
            className={`profile-nav-btn ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            <span className="nav-btn-icon-label">
              <span>🎯</span> Monthly Budget
            </span>
            <span className="nav-arrow-indicator">›</span>
          </button>

          <button
            type="button"
            className={`profile-nav-btn ${activeTab === 'sizing' ? 'active' : ''}`}
            onClick={() => setActiveTab('sizing')}
          >
            <span className="nav-btn-icon-label">
              <span>📏</span> Sizing, Style &amp; Rewards
            </span>
            <span className="nav-arrow-indicator">›</span>
          </button>

          <button
            type="button"
            className={`profile-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className="nav-btn-icon-label">
              <span>🔒</span> Security &amp; Password
            </span>
            <span className="nav-arrow-indicator">›</span>
          </button>

          <button
            type="button"
            className={`profile-nav-btn danger-tab ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            <span className="nav-btn-icon-label">
              <span>⚠️</span> Delete Account
            </span>
            <span className="nav-arrow-indicator">›</span>
          </button>
        </aside>

        {/* Right: Active Tab Form View */}
        <main className="profile-content-card">
          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <form onSubmit={handleSaveProfile}>
              <div className="content-header-row">
                <div>
                  <h3>👤 Personal Information</h3>
                  <div className="content-subtitle-note">
                    Update your display name, contact phone number, and age.
                  </div>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-input-group">
                  <label>Full Name / Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="profile-input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={formData.emailId}
                    title="Email is your unique account identifier"
                  />
                  <span className="input-helper-note">✓ Verified Account Email</span>
                </div>

                <div className="profile-input-group">
                  <label>Mobile Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                  <span className="input-helper-note">Used for order tracking and delivery alerts</span>
                </div>

                <div className="profile-input-group">
                  <label>Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g. 25"
                  />
                </div>
              </div>

              <div className="profile-save-row">
                <button type="submit" className="profile-save-btn" disabled={saving}>
                  {saving ? 'Saving Changes...' : 'Save Personal Details'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: DELIVERY ADDRESS */}
          {activeTab === 'address' && (
            <form onSubmit={handleSaveProfile}>
              <div className="content-header-row">
                <div>
                  <h3>📍 Shipping &amp; Delivery Address</h3>
                  <div className="content-subtitle-note">
                    Default address used for 1-click checkout and deliveries.
                  </div>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-input-group full-width">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value },
                      })
                    }
                    placeholder="Flat/House No., Building, Street Area"
                  />
                </div>

                <div className="profile-input-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    placeholder="e.g. Mumbai, Bengaluru"
                  />
                </div>

                <div className="profile-input-group">
                  <label>State / Province</label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                    placeholder="e.g. Maharashtra, Karnataka"
                  />
                </div>

                <div className="profile-input-group">
                  <label>Postal / PIN Code</label>
                  <input
                    type="text"
                    value={formData.address.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, postalCode: e.target.value },
                      })
                    }
                    placeholder="e.g. 400001"
                  />
                </div>

                <div className="profile-input-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={formData.address.country}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, country: e.target.value },
                      })
                    }
                    placeholder="India"
                  />
                </div>
              </div>

              <div className="profile-save-row">
                <button type="submit" className="profile-save-btn" disabled={saving}>
                  {saving ? 'Saving Address...' : 'Save Delivery Address'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: BUDGET SETTINGS */}
          {activeTab === 'budget' && (
            <form onSubmit={handleSaveProfile}>
              <div className="content-header-row">
                <div>
                  <h3>🎯 Smart Monthly Budget Limit</h3>
                  <div className="content-subtitle-note">
                    Set a monthly spending limit to receive smart alerts in your cart and dashboard.
                  </div>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-input-group full-width">
                  <label>Monthly Budget Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="Enter limit, e.g. 15000"
                  />
                  <span className="input-helper-note">Set to 0 to disable budget alerts.</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div style={{ marginTop: '0.8rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>
                  QUICK PRESETS:
                </span>
                <div className="budget-presets-row">
                  {[5000, 10000, 20000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="budget-preset-pill"
                      onClick={() => setFormData({ ...formData, budget: amt })}
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Budget Status Box */}
              {currentBudget > 0 && (
                <div className={`budget-live-status-box ${isOverBudget ? 'exceeded' : ''}`}>
                  <div className="budget-status-row">
                    <div>
                      <strong>
                        {isOverBudget ? '⚠️ Budget Limit Exceeded' : '✅ On Track This Month'}
                      </strong>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                        Spent: ₹{spent.toLocaleString()} of ₹{currentBudget.toLocaleString()} limit
                      </div>
                    </div>
                    <span className="budget-status-val">
                      {isOverBudget
                        ? `-₹${Math.abs(remaining).toFixed(0)} Over`
                        : `₹${remaining.toFixed(0)} Left`}
                    </span>
                  </div>

                  <div style={{ height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '50px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: isOverBudget ? '#ef4444' : '#10b981',
                        borderRadius: '50px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="profile-save-row">
                <button type="submit" className="profile-save-btn" disabled={saving}>
                  {saving ? 'Updating Budget...' : 'Save Budget Preference'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword}>
              <div className="content-header-row">
                <div>
                  <h3>🔒 Password &amp; Account Security</h3>
                  <div className="content-subtitle-note">
                    Ensure your account is protected with a secure password.
                  </div>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-input-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={pwdData.newPassword}
                    onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="profile-input-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={pwdData.confirmPassword}
                    onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div className="profile-save-row">
                <button type="submit" className="profile-save-btn" disabled={saving}>
                  {saving ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}

          {/* TAB: SIZING, STYLE & REWARDS */}
          {activeTab === 'sizing' && (
            <div>
              {/* 1. Sizing & Fit Predictor Settings */}
              <form onSubmit={handleSaveSizing} style={{ marginBottom: '2.5rem' }}>
                <div className="content-header-row">
                  <div>
                    <h3>📏 Size &amp; Fit Calibration</h3>
                    <div className="content-subtitle-note">
                      These measurements train the fit predictor algorithm using your past purchases and return reasons.
                    </div>
                  </div>
                </div>

                <div className="profile-form-grid">
                  <div className="profile-input-group">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      min="120"
                      max="230"
                      value={sizingData.height}
                      onChange={(e) => setSizingData({ ...sizingData, height: e.target.value })}
                    />
                  </div>

                  <div className="profile-input-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      min="35"
                      max="180"
                      value={sizingData.weight}
                      onChange={(e) => setSizingData({ ...sizingData, weight: e.target.value })}
                    />
                  </div>

                  <div className="profile-input-group">
                    <label>Preferred Fit</label>
                    <select
                      value={sizingData.preferredFit}
                      onChange={(e) => setSizingData({ ...sizingData, preferredFit: e.target.value })}
                      style={{ padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                    >
                      <option value="slim">Slim Fit (Snug)</option>
                      <option value="regular">Regular Fit (Standard)</option>
                      <option value="relaxed">Relaxed Fit (Comfortable)</option>
                      <option value="oversized">Oversized (Streetwear Drape)</option>
                    </select>
                  </div>

                  <div className="profile-input-group">
                    <label>Footwear Size (UK)</label>
                    <input
                      type="text"
                      placeholder="e.g. 9 or 10"
                      value={sizingData.shoeSize}
                      onChange={(e) => setSizingData({ ...sizingData, shoeSize: e.target.value })}
                    />
                  </div>
                </div>

                <div className="profile-save-row">
                  <button type="submit" className="profile-save-btn" disabled={savingSizing}>
                    {savingSizing ? 'Saving...' : 'Save Sizing Profile'}
                  </button>
                </div>
              </form>

              {/* 2. Style Quiz Persona */}
              <div style={{ marginBottom: '2.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '18px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    🎨 Style Persona: {user?.styleQuiz?.primaryVibe || 'Default Modern'}
                  </h4>
                  <button
                    type="button"
                    className="retake-quiz-btn"
                    onClick={() => setStyleQuizOpen(true)}
                  >
                    ⚙️ Retake Style Quiz
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                  Categories: {(user?.styleQuiz?.preferredCategories || ['Clothing', 'Footwear']).join(', ')} • Stance: {user?.styleQuiz?.budgetTier || 'Balanced'}
                </p>
              </div>

              {/* 3. Streaks & Spin Rewards */}
              <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #fefce8 0%, #ffffff 100%)', borderRadius: '18px', border: '1.5px solid #fde047' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#854d0e' }}>
                    🎁 Daily Streak: 🔥 Day {user?.dailyStreak?.count || 1} • 🪙 {user?.rewardCoins || 50} Coins
                  </h4>
                  <button
                    type="button"
                    className="spin-action-btn"
                    style={{ padding: '8px 20px', fontSize: '0.84rem' }}
                    onClick={() => setSpinModalOpen(true)}
                  >
                    🎯 Open Spin-the-Wheel
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#713f12' }}>
                  Log in daily to keep your streak going and spin the wheel for exclusive promo coupons!
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: DANGER ZONE (DELETE ACCOUNT) */}
          {activeTab === 'danger' && (
            <div>
              <div className="content-header-row">
                <div>
                  <h3 style={{ color: '#dc2626' }}>⚠️ Delete Account</h3>
                  <div className="content-subtitle-note">
                    Permanent account closure and data removal.
                  </div>
                </div>
              </div>

              <div className="danger-zone-box">
                <div className="danger-zone-title">Are you sure you want to delete your account?</div>
                <p className="danger-zone-desc">
                  Deleting your account will permanently remove your profile, order history, saved
                  wishlist items, and active cart. This action cannot be reversed.
                </p>
                <button
                  type="button"
                  className="danger-delete-btn"
                  onClick={handleDeleteAccount}
                >
                  Yes, Permanently Delete My Account
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sizing, Style & Rewards Modals */}
      <SpinWheelModal isOpen={spinModalOpen} onClose={() => setSpinModalOpen(false)} />
      <StyleQuizModal isOpen={styleQuizOpen} onClose={() => setStyleQuizOpen(false)} />

      <Toast message={toast} />
    </div>
  );
}
