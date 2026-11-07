import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="home-hero-wrapper">
      <section className="dash-banner-card home-banner-sage">
        <div className="dash-banner-content">
          <div className="dash-hero-badge">
            <span className="live-pulse-dot"></span> New Season Arrivals
          </div>
          <h1 className="dash-banner-title">
            Curated collections
          </h1>
          <div className="dash-banner-subtitle">
            shopping with joy
          </div>

          <form onSubmit={handleSearch} className="dash-banner-search">
            <span className="dash-search-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search products, styles & brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="home-hero-actions-row">
            <Link to="/products" className="home-cta-btn-dark">
              Shop Now →
            </Link>
            <Link to="/products?category=Electronics" className="home-cta-btn-outline">
              Explore Deals
            </Link>
          </div>
        </div>

        {/* Right Art Graphic (Matching Reference Image) */}
        <div className="dash-banner-artwork">
          <div className="artwork-illustration-box">
            <span className="artwork-main-emoji">🌿</span>
            <div className="artwork-sub-badges">
              <span className="art-badge">⭐ 4.9 Rating</span>
              <span className="art-badge">⚡ Instant Dispatch</span>
              <span className="art-badge">📦 Free Delivery</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
