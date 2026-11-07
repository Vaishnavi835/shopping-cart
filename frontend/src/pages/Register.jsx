import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StyleQuizModal from '../components/StyleQuizModal';
import './AuthSplit.css';

export default function Register() {
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: '',
    emailId: '',
    phone: '',
    age: '22',
    password: '',
  });

  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const navigate = useNavigate();

  // 🌟 Live Dynamic State
  const [liveShoppers, setLiveShoppers] = useState(148);
  const [recentOrderIndex, setRecentOrderIndex] = useState(0);
  const [flashSeconds, setFlashSeconds] = useState(864); // ~14m 24s

  const liveOrders = [
    { name: 'Aarav Sharma', city: 'Mumbai', item: 'Wireless Bluetooth Headphones', price: '₹2,699', time: '12s ago', avatar: '👨‍💼', tag: 'Electronics' },
    { name: 'Priya Patel', city: 'Bangalore', item: 'Cotton Comfort Hoodie', price: '₹1,299', time: '34s ago', avatar: '👩‍🎨', tag: 'Clothing' },
    { name: 'Rahul Verma', city: 'Delhi', item: 'Smartwatch Pro GPS', price: '₹6,999', time: 'Just now', avatar: '👨‍💻', tag: 'Gadgets' },
    { name: 'Ananya Roy', city: 'Kolkata', item: 'Polarized Sunglasses UV400', price: '₹899', time: '48s ago', avatar: '👩‍💼', tag: 'Accessories' },
  ];

  useEffect(() => {
    // Gentle slow shopper fluctuation (every 8s)
    const shopperInterval = setInterval(() => {
      setLiveShoppers((prev) => Math.max(120, prev + (Math.floor(Math.random() * 5) - 2)));
    }, 8000);

    // Smooth order rotation (every 6.5s)
    const orderInterval = setInterval(() => {
      setRecentOrderIndex((prev) => (prev + 1) % liveOrders.length);
    }, 6500);

    // Countdown timer for live flash deal
    const timerInterval = setInterval(() => {
      setFlashSeconds((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);

    return () => {
      clearInterval(shopperInterval);
      clearInterval(orderInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 4-level strength calculation
  const calculateStrength = (pwd) => {
    if (!pwd) return { level: 0, text: 'Enter a strong password' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score === 1) return { level: 1, text: 'Weak. Add numbers & uppercase letters.' };
    if (score === 2) return { level: 2, text: 'Medium. Add a special symbol.' };
    if (score === 3) return { level: 3, text: 'Strong. Add a symbol to make it stronger.' };
    return { level: 4, text: 'Very strong & secure password.' };
  };

  const strength = calculateStrength(form.password);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailId);
  const currentOrder = liveOrders[recentOrderIndex];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!form.username.trim() || !form.emailId.trim() || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms and Privacy Policy.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
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
          age: Number(form.age) || 21,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.token && data.user) {
          login(data.user, data.token);
          setMsg('Account created successfully! ✨');
          setShowQuizModal(true);
        } else {
          setMsg('Account created! Redirecting to sign in...');
          setTimeout(() => navigate('/login'), 1500);
        }
      } else {
        setError(data.message || 'Registration failed. Try a different email.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-light-wrapper">
      <div className="auth-light-card">
        {/* Left Column: Light Clean Form */}
        <div className="auth-light-left">
          <div className="auth-brand-badge">
            <span className="brand-dot"></span> NOVA Official
          </div>

          <div className="auth-light-header">
            <h1 className="auth-title-clean">Create your account</h1>
            <p className="auth-subtitle-clean">Takes less than a minute.</p>
          </div>

          {error && <div className="auth-alert-error">⚠️ {error}</div>}
          {msg && <div className="auth-alert-success">✅ {msg}</div>}

          <form onSubmit={handleSubmit} className="auth-form-clean">
            {/* Full Name */}
            <div className="auth-field-clean">
              <label>Full name</label>
              <input
                type="text"
                name="username"
                placeholder="e.g. Vaishnavi"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email with checkmark */}
            <div className="auth-field-clean">
              <label>Email</label>
              <div className="input-with-check-light">
                <input
                  type="email"
                  name="emailId"
                  placeholder="name@email.com"
                  value={form.emailId}
                  onChange={handleChange}
                  required
                />
                {isEmailValid && (
                  <span className="check-badge-light" title="Valid email address">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" stroke="#10b981" />
                      <polyline points="16 9 10 15 7 12" />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Number */}
            <div className="auth-field-clean">
              <label>Mobile number</label>
              <div className="phone-combo-light">
                <span className="phone-code-light">+91</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="98765 43210"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password with 4-segment strength */}
            <div className="auth-field-clean">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />

              <div className="strength-row-light">
                <div className={`segment-light ${strength.level >= 1 ? 'seg-active' : ''}`}></div>
                <div className={`segment-light ${strength.level >= 2 ? 'seg-active' : ''}`}></div>
                <div className={`segment-light ${strength.level >= 3 ? 'seg-active' : ''}`}></div>
                <div className={`segment-light ${strength.level >= 4 ? 'seg-active' : ''}`}></div>
              </div>
              <p className="strength-caption">{strength.text}</p>
            </div>

            {/* Terms checkbox */}
            <label className="checkbox-clean">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>I agree to the <a href="#terms">Terms and Privacy Policy</a></span>
            </label>

            {/* Primary Action Button */}
            <button
              type="submit"
              className="btn-primary-clean"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            {/* Bottom link */}
            <div className="switch-text-clean">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </form>
        </div>

        {/* Right Column: High-End Live Interactive Experience */}
        <div className="auth-light-right">
          {/* Header */}
          <div className="right-card-header">
            <h2 className="what-you-get-clean">What you get</h2>
            <div className="live-pill-indicator">
              <span className="live-pulse-dot"></span>
              <span className="live-pulse-text">LIVE ACTIVITY</span>
            </div>
          </div>

          {/* Benefits List */}
          <ul className="benefits-list-clean">
            <li className="benefit-row-clean">
              <div className="benefit-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div className="benefit-content">
                <strong>Wishlists you can share</strong>
                <span>Collaborate with friends and family seamlessly</span>
              </div>
            </li>

            <li className="benefit-row-clean">
              <div className="benefit-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="benefit-content">
                <strong>Price drop alerts</strong>
                <span>Get notified instantly when saved products drop</span>
              </div>
            </li>

            <li className="benefit-row-clean">
              <div className="benefit-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div className="benefit-content">
                <strong>Live order tracking</strong>
                <span>Real-time dispatch updates with precise courier ETA</span>
              </div>
            </li>

            <li className="benefit-row-clean">
              <div className="benefit-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                  <polyline points="20 12 20 22 4 22 4 12" />
                  <rect x="2" y="7" width="20" height="5" />
                  <line x1="12" y1="22" x2="12" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
              </div>
              <div className="benefit-content">
                <strong>Welcome offer on first order</strong>
                <span>Flat 20% instant discount applied at checkout</span>
              </div>
            </li>
          </ul>

          {/* 🌟 ENHANCED LIVE SHOWCASE CARD */}
          <div className="live-interactive-card">
            {/* Live Stats Header */}
            <div className="live-card-topbar">
              <div className="live-stat-badge">
                <span className="live-green-radar"></span>
                <span><strong>{liveShoppers}</strong> shoppers active now</span>
              </div>
              <div className="live-flash-timer">
                ⚡ Offer ends in <strong>{formatTimer(flashSeconds)}</strong>
              </div>
            </div>

            {/* Live Real-Time Purchase Activity Tile with Smooth Animated Transition */}
            <div className="live-order-tile" key={recentOrderIndex}>
              <div className="live-avatar-circle">{currentOrder.avatar}</div>
              <div className="live-order-info">
                <div className="live-buyer-row">
                  <span className="buyer-name">{currentOrder.name}</span>
                  <span className="buyer-city">📍 {currentOrder.city}</span>
                </div>
                <div className="buyer-product-name">{currentOrder.item}</div>
                <div className="buyer-meta">
                  <span className="buyer-price">{currentOrder.price}</span>
                  <span className="buyer-tag">{currentOrder.tag}</span>
                  <span className="buyer-time">✓ {currentOrder.time}</span>
                </div>
              </div>
            </div>

            {/* Smooth live transition ticker line */}
            <div className="live-cycle-bar">
              <div className="live-cycle-fill" key={`bar-${recentOrderIndex}`}></div>
            </div>

            {/* Live Verification Bar */}
            <div className="live-security-strip">
              <span>🛡️ 256-Bit SSL Encrypted</span>
              <span>•</span>
              <span>⭐ 4.9/5 Rating</span>
              <span>•</span>
              <span>⚡ Fast Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Style Quiz Modal upon signup */}
      <StyleQuizModal
        isOpen={showQuizModal}
        onClose={() => navigate('/products')}
        onCompleted={() => navigate('/')}
      />
    </div>
  );
}
