import { Link } from 'react-router-dom';

export default function FeatureBanners() {
  return (
    <section className="shop-feature-banners">
      <div className="shop-feature-banner banner-teal">
        <div className="banner-content">
          <span className="banner-eyebrow">Free Shipping</span>
          <div className="banner-title">Free delivery on orders over ₹999</div>
          <Link to="/products" className="banner-cta">Shop Now →</Link>
        </div>
      </div>
      <div className="shop-feature-banner banner-orange">
        <div className="banner-content">
          <span className="banner-eyebrow">Flash Sale</span>
          <div className="banner-title">Up to 50% off on Electronics</div>
          <Link to="/products?category=Electronics" className="banner-cta">Explore Deals →</Link>
        </div>
      </div>
      <div className="shop-feature-banner banner-dark">
        <div className="banner-content">
          <span className="banner-eyebrow">New Arrivals</span>
          <div className="banner-title">First purchase — 20% Discount</div>
          <Link to="/products" className="banner-cta">Start Shopping →</Link>
        </div>
      </div>
    </section>
  );
}

