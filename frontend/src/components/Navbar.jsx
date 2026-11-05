import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, token, logout, cartCount, darkMode, toggleDarkMode, compareItems } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [categories, setCategories] = useState(['Clothing', 'Footwear', 'Electronics', 'Kitchen']);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setSideDrawerOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname, location.search]);

  // Fetch unique categories
  useEffect(() => {
    if (token) {
      fetch('/api/products/categories', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Hide entire navbar on Login and Register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const handleLogout = () => {
    setSideDrawerOpen(false);
    setProfileDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const currentCategory = new URLSearchParams(location.search).get('category') || '';
  const isAllProductsActive = location.pathname === '/products' && !currentCategory;
  const isDashboardActive = location.pathname === '/dashboard';

  return (
    <>
      <header className="myntra-navbar">
        <div className="myntra-navbar-container">
          {/* Left: ☰ Menu Button + Logo */}
          <div className="myntra-nav-left">
            {user && (
              <button
                type="button"
                className="myntra-menu-btn"
                onClick={() => setSideDrawerOpen(true)}
                title="Open Navigation Menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                <span className="myntra-menu-label">Menu</span>
              </button>
            )}

            <Link to="/products" className="myntra-logo-link" title="NOVA Home">
              <div className="brand-logo-emblem">
                <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
                  <defs>
                    <linearGradient id="nova-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#c94b72" />
                      <stop offset="0.6" stopColor="#b73e65" />
                      <stop offset="1" stopColor="#d4a373" />
                    </linearGradient>
                    <linearGradient id="champagne-star" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#fff3e0" />
                      <stop offset="1" stopColor="#d4a373" />
                    </linearGradient>
                  </defs>
                  <rect width="36" height="36" rx="10" fill="url(#nova-grad)" />
                  <path d="M11 25V11L25 25V11" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M25 6.5L25.8 8.5L28 9.3L25.8 10.1L25 12.1L24.2 10.1L22 9.3L24.2 8.5Z" fill="url(#champagne-star)" />
                </svg>
              </div>
              <span className="myntra-logo-text">
                NO<span className="logo-accent">VA</span>
              </span>
            </Link>
          </div>

          {/* Desktop Category Navigation */}
          {user && (
            <nav className="myntra-category-nav">
              {/* Dashboard Tab */}
              <Link
                to="/dashboard"
                className={`myntra-cat-link ${isDashboardActive ? 'active' : ''}`}
                title="Personalized Shopping Dashboard"
              >
                <span>DASHBOARD</span>
                {isDashboardActive && <div className="active-nav-indicator" />}
              </Link>

              {categories.map((cat) => {
                const isActive = location.pathname === '/products' && currentCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <Link
                    key={cat}
                    to={`/products?category=${encodeURIComponent(cat)}`}
                    className={`myntra-cat-link ${isActive ? 'active' : ''}`}
                  >
                    <span>{cat.toUpperCase()}</span>
                    {isActive && <div className="active-nav-indicator" />}
                  </Link>
                );
              })}

              <Link
                to="/products"
                className={`myntra-cat-link ${isAllProductsActive ? 'active' : ''}`}
              >
                <span>ALL PRODUCTS</span>
                {isAllProductsActive && <div className="active-nav-indicator" />}
              </Link>
            </nav>
          )}

          {/* Global Search Bar */}
          {user && (
            <form onSubmit={handleSearchSubmit} className="myntra-header-search">
              <button type="submit" className="search-submit-icon" aria-label="Search">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Search for products, brands and more"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-icon"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </form>
          )}

          {/* Right Action Bar (Dark Mode Toggle, Profile, Wishlist, Bag) */}
          {user ? (
            <div className="myntra-header-actions">
              {/* 🌙 Dark Mode Toggle Button */}
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={toggleDarkMode}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* 1. Profile Dropdown Trigger */}
              <div
                className="myntra-action-item profile-dropdown-wrapper"
                ref={dropdownRef}
                onMouseEnter={() => setProfileDropdownOpen(true)}
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="myntra-action-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="action-label">Profile</span>
                </button>

                {/* Myntra-style Profile Flyout Menu */}
                {profileDropdownOpen && (
                  <div className="myntra-profile-flyout">
                    <div className="profile-flyout-header">
                      <div className="flyout-welcome">Welcome, {user.username}</div>
                      <div className="flyout-email">{user.emailId}</div>
                    </div>

                    <div className="flyout-divider" />

                    <div className="flyout-links">
                      <Link to="/dashboard" className="flyout-link highlight-link">
                        ✨ Smart Dashboard
                      </Link>
                      <Link to="/orders" className="flyout-link">
                        Orders
                      </Link>
                      <Link to="/wishlist" className="flyout-link">
                        Wishlist
                      </Link>
                      <Link to="/cart" className="flyout-link">
                        Shopping Bag ({cartCount})
                      </Link>
                      <Link to="/profile" className="flyout-link">
                        My Profile &amp; Budget
                      </Link>
                    </div>

                    <div className="flyout-divider" />

                    <div className="flyout-footer">
                      <button
                        type="button"
                        className="flyout-theme-toggle"
                        onClick={toggleDarkMode}
                      >
                        {darkMode ? '☀️ Light Theme' : '🌙 Dark Theme'}
                      </button>
                      <button
                        type="button"
                        className="flyout-logout-btn"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Wishlist Button */}
              <Link to="/wishlist" className="myntra-action-item">
                <div className="myntra-action-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span className="action-label">Wishlist</span>
                </div>
              </Link>

              {/* 3. Bag Button */}
              <Link to="/cart" className="myntra-action-item">
                <div className="myntra-action-btn bag-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span className="action-label">Bag</span>
                  {cartCount > 0 && (
                    <span className="myntra-bag-badge">{cartCount}</span>
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <div className="myntra-auth-btns">
              <Link to="/login" className="myntra-login-link">Log In</Link>
              <Link to="/register" className="myntra-signup-btn">Sign Up</Link>
            </div>
          )}
        </div>
      </header>

      {/* ─── Myntra-Style Mobile / Hamburger Side Drawer ─── */}
      {user && (
        <>
          <div
            className={`myntra-drawer-backdrop ${sideDrawerOpen ? 'active' : ''}`}
            onClick={() => setSideDrawerOpen(false)}
          />

          <aside className={`myntra-side-drawer ${sideDrawerOpen ? 'active' : ''}`}>
            {/* Top User Greeting Banner */}
            <div className="myntra-drawer-banner">
              <div className="banner-user-row">
                <div className="banner-avatar">
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="banner-user-info">
                  <div className="banner-greeting">Hello, {user.username}</div>
                  <div className="banner-email">{user.emailId}</div>
                </div>
                <button
                  type="button"
                  className="banner-close-btn"
                  onClick={() => setSideDrawerOpen(false)}
                  aria-label="Close Menu"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Drawer Navigation Body */}
            <div className="myntra-drawer-content">
              {/* Smart Features Section */}
              <div className="drawer-cat-section">
                <div className="drawer-heading">SMART FEATURES</div>
                <Link
                  to="/dashboard"
                  className="drawer-cat-item highlight"
                  onClick={() => setSideDrawerOpen(false)}
                >
                  <span>✨ Smart Shopping Dashboard</span>
                  <span className="drawer-arrow">›</span>
                </Link>
              </div>

              <div className="drawer-hr" />

              {/* Categories Section */}
              <div className="drawer-cat-section">
                <div className="drawer-heading">SHOP BY CATEGORY</div>
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    to={`/products?category=${encodeURIComponent(cat)}`}
                    className="drawer-cat-item"
                    onClick={() => setSideDrawerOpen(false)}
                  >
                    <span>{cat}</span>
                    <span className="drawer-arrow">›</span>
                  </Link>
                ))}
                <Link
                  to="/products"
                  className="drawer-cat-item"
                  onClick={() => setSideDrawerOpen(false)}
                >
                  <span>All Products</span>
                  <span className="drawer-arrow">›</span>
                </Link>
              </div>

              <div className="drawer-hr" />

              {/* My Account Section */}
              <div className="drawer-cat-section">
                <div className="drawer-heading">MY ACCOUNT</div>
                <Link
                  to="/orders"
                  className="drawer-cat-item"
                  onClick={() => setSideDrawerOpen(false)}
                >
                  <span>My Orders</span>
                  <span className="drawer-arrow">›</span>
                </Link>
                <Link
                  to="/wishlist"
                  className="drawer-cat-item"
                  onClick={() => setSideDrawerOpen(false)}
                >
                  <span>My Wishlist</span>
                  <span className="drawer-arrow">›</span>
                </Link>
                <Link
                  to="/cart"
                  className="drawer-cat-item"
                  onClick={() => setSideDrawerOpen(false)}
                >
                  <span>Shopping Bag ({cartCount})</span>
                  <span className="drawer-arrow">›</span>
                </Link>
                <Link
                  to="/profile"
                  className="drawer-cat-item"
                  onClick={() => setSideDrawerOpen(false)}
                >
                  <span>Profile &amp; Settings</span>
                  <span className="drawer-arrow">›</span>
                </Link>
              </div>

              <div className="drawer-hr" />

              {/* Preferences & Logout */}
              <div className="drawer-cat-section">
                <button
                  type="button"
                  className="drawer-cat-item"
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onClick={toggleDarkMode}
                >
                  <span>{darkMode ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}</span>
                </button>
                <button
                  type="button"
                  className="drawer-logout-action"
                  onClick={handleLogout}
                >
                  <span>🚪 Log Out</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
