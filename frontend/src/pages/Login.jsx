import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ emailId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.emailId.trim() || !form.password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: form.emailId.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        navigate('/products');
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch {
      setError('Network error. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="classy-auth-page">
      {/* Dynamic Animated Ambient Background Orbs */}
      <div className="ambient-orb orb-purple"></div>
      <div className="ambient-orb orb-cyan"></div>
      <div className="ambient-orb orb-pink"></div>

      <div className="classy-auth-card">
        {/* Brand Header */}
        <div className="classy-brand-header">
          <div className="classy-logo-pill">
            <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="9" fill="url(#nova-auth-grad)" />
              <path d="M11 25V11L25 25V11" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M25 6.5L25.8 8.5L28 9.3L25.8 10.1L25 12.1L24.2 10.1L22 9.3L24.2 8.5Z" fill="#fff3e0" />
              <defs>
                <linearGradient id="nova-auth-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#c94b72" />
                  <stop offset="1" stopColor="#d4a373" />
                </linearGradient>
              </defs>
            </svg>
            <span className="logo-text">NOVA</span>
          </div>
          <h1 className="classy-title">Welcome Back</h1>
          <p className="classy-subtitle">Sign in to your NOVA personal account</p>
        </div>

        {/* Navigation Tabs */}
        <div className="classy-nav-tabs">
          <button type="button" className="classy-tab active">Log In</button>
          <Link to="/register" className="classy-tab">Register</Link>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="classy-alert classy-alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="classy-form">
          {/* Email Field */}
          <div className="classy-input-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="classy-input-container">
              <span className="classy-input-icon">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="login-email"
                type="email"
                name="emailId"
                placeholder="name@company.com"
                value={form.emailId}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="classy-input-group">
            <div className="label-with-action">
              <label htmlFor="login-password">Password</label>
            </div>
            <div className="classy-input-container">
              <span className="classy-input-icon">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="classy-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="classy-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="classy-loader-inline">
                <span className="spinner-ring"></span>
                <span>Signing in...</span>
              </span>
            ) : (
              <span className="btn-content">
                <span>Sign In to Account</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="classy-auth-footer">
          <span>Don&apos;t have an account yet?</span>
          <Link to="/register" className="classy-link-highlight">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
