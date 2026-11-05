import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: '',
    emailId: '',
    age: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Password requirement tests
  const rules = [
    { id: 'length', label: 'Minimum 8 characters', valid: form.password.length >= 8 },
    { id: 'upper', label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(form.password) },
    { id: 'lower', label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(form.password) },
    { id: 'number', label: 'One numeric digit (0-9)', valid: /[0-9]/.test(form.password) },
    { id: 'special', label: 'One special symbol (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(form.password) },
  ];

  const validCount = rules.filter((r) => r.valid).length;
  const isPasswordFullyValid = validCount === rules.length;
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  // Strength calculation & styling
  const getStrength = () => {
    if (!form.password) return { label: '', color: '#334155', width: '0%', textClass: '' };
    if (validCount <= 2) return { label: 'Weak', color: '#f43f5e', width: '33%', textClass: 'text-weak' };
    if (validCount <= 4) return { label: 'Good', color: '#f59e0b', width: '66%', textClass: 'text-medium' };
    return { label: 'Strong & Secure', color: '#10b981', width: '100%', textClass: 'text-strong' };
  };

  const strength = getStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    if (!form.username.trim() || !form.emailId.trim() || !form.age || !form.password) {
      setError('Please complete all required fields.');
      return;
    }

    if (!isPasswordFullyValid) {
      setError('Please fulfill all password requirements before registering.');
      setTouchedPassword(true);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (Number(form.age) < 1 || isNaN(form.age)) {
      setError('Please enter a valid age.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim(),
          emailId: form.emailId.trim().toLowerCase(),
          age: Number(form.age),
          password: form.password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Auto-login: store user & token, then redirect to products
        if (data.token && data.user) {
          login(data.user, data.token);
          setMsg(data.message || 'Account created! Redirecting...');
          setTimeout(() => navigate('/products'), 1500);
        } else {
          setMsg(data.message || 'Account successfully created! Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        }
      } else {
        setError(data.message || 'Registration failed.');
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
              <rect width="36" height="36" rx="9" fill="url(#nova-reg-grad)" />
              <path d="M11 25V11L25 25V11" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M25 6.5L25.8 8.5L28 9.3L25.8 10.1L25 12.1L24.2 10.1L22 9.3L24.2 8.5Z" fill="#fff3e0" />
              <defs>
                <linearGradient id="nova-reg-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#c94b72" />
                  <stop offset="1" stopColor="#d4a373" />
                </linearGradient>
              </defs>
            </svg>
            <span className="logo-text">NOVA</span>
          </div>
          <h1 className="classy-title">Create Account</h1>
          <p className="classy-subtitle">Join the exclusive shopping experience with NOVA</p>
        </div>

        {/* Navigation Tabs */}
        <div className="classy-nav-tabs">
          <Link to="/login" className="classy-tab">Log In</Link>
          <button type="button" className="classy-tab active">Register</button>
        </div>

        {/* Notifications */}
        {msg && (
          <div className="classy-alert classy-alert-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{msg}</span>
          </div>
        )}

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
          {/* Username */}
          <div className="classy-input-group">
            <label htmlFor="reg-username">Full Name</label>
            <div className="classy-input-container">
              <span className="classy-input-icon">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="reg-username"
                type="text"
                name="username"
                placeholder="Eleanor Vance"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="classy-input-group">
            <label htmlFor="reg-email">Email Address</label>
            <div className="classy-input-container">
              <span className="classy-input-icon">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="reg-email"
                type="email"
                name="emailId"
                placeholder="eleanor@example.com"
                value={form.emailId}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Age */}
          <div className="classy-input-group">
            <label htmlFor="reg-age">Age</label>
            <div className="classy-input-container">
              <span className="classy-input-icon">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <input
                id="reg-age"
                type="number"
                name="age"
                placeholder="e.g. 25"
                min="1"
                max="120"
                value={form.age}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="classy-input-group">
            <label htmlFor="reg-password">Password</label>
            <div className="classy-input-container">
              <span className="classy-input-icon">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create strong password"
                value={form.password}
                onChange={(e) => {
                  handleChange(e);
                  setTouchedPassword(true);
                }}
                required
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

            {/* Live Password Strength Meter */}
            {form.password.length > 0 && (
              <div className="classy-strength-meter">
                <div className="strength-header">
                  <span className="strength-label">Security Strength:</span>
                  <span className={`strength-badge ${strength.textClass}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="strength-bar-bg">
                  <div
                    className="strength-bar-fill"
                    style={{
                      width: strength.width,
                      backgroundColor: strength.color,
                      boxShadow: `0 0 12px ${strength.color}`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Live Password Requirements Checklist */}
            {(touchedPassword || form.password.length > 0) && (
              <div className="classy-checklist-card">
                <div className="checklist-heading">Password Security Requirements:</div>
                <div className="checklist-items">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`checklist-row ${rule.valid ? 'is-valid' : 'is-pending'}`}
                    >
                      <div className="check-badge">
                        {rule.valid ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span className="dot-pending"></span>
                        )}
                      </div>
                      <span className="checklist-text">{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="classy-input-group">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <div className="classy-input-container">
              <span className="classy-input-icon">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-1.5 1.5L16 7m-4 4l-4 4-2-2 4-4m1.5-1.5L13 6m6-4l2 2" />
                  <circle cx="7.5" cy="16.5" r="4.5" />
                </svg>
              </span>
              <input
                id="reg-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="classy-eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
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
            {form.confirmPassword.length > 0 && (
              <div className={`match-badge ${passwordsMatch ? 'match-valid' : 'match-invalid'}`}>
                {passwordsMatch ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Passwords match</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span>Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="classy-submit-btn"
            disabled={loading || (form.password.length > 0 && !isPasswordFullyValid)}
          >
            {loading ? (
              <span className="classy-loader-inline">
                <span className="spinner-ring"></span>
                <span>Creating Profile...</span>
              </span>
            ) : (
              <span className="btn-content">
                <span>Complete Registration</span>
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
          <span>Already have an account?</span>
          <Link to="/login" className="classy-link-highlight">Log in here</Link>
        </div>
      </div>
    </div>
  );
}
