import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="shop-footer">
      <div className="shop-footer-grid">
        <div>
          <div className="footer-brand">NOVA</div>
          <p className="footer-tagline">
            Your one-stop destination for curated products — classy, modern, and affordable.
            Shop confidently with 100% authentic products and free delivery.
          </p>
        </div>
        <div>
          <div className="footer-heading">Help</div>
          <ul className="footer-links">
            <li><Link to="/products">Delivery &amp; Returns</Link></li>
            <li><Link to="/products">FAQ</Link></li>
            <li><Link to="/orders">Track Order</Link></li>
            <li><Link to="/products">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-heading">Shop</div>
          <ul className="footer-links">
            <li><Link to="/products">New Arrivals</Link></li>
            <li><Link to="/products?category=Electronics">Electronics</Link></li>
            <li><Link to="/products?category=Clothing">Clothing</Link></li>
            <li><Link to="/products?category=Accessories">Accessories</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-heading">Get in Touch</div>
          <ul className="footer-links">
            <li><span>Call: (905) 999-0123</span></li>
            <li><span>Email: support@novashop.com</span></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 NOVA. All rights reserved.</span>
        <span>🔒 Safe &amp; Secure Payments · ⚡ 100% Authentic Products</span>
      </div>
    </footer>
  );
}

