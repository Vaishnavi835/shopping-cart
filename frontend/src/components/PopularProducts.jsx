import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PopularProducts() {
  const { authFetch, wishlistIds, toggleWishlist, addToCart, addingToCartId } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          // Take first 4 or 8 products for "Most Popular"
          setProducts(data.products.slice(0, 4));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-popular-section">
      <div className="shop-section-header">
        <div>
          <h2 className="shop-section-title">Most Popular</h2>
          <p className="shop-section-sub">Top rated essentials chosen by our shoppers</p>
        </div>
        <Link to="/products" className="shop-section-link">
          Show All →
        </Link>
      </div>

      {loading ? (
        <div className="popular-loader">
          <div className="shop-spinner"></div>
          <span>Loading popular items...</span>
        </div>
      ) : (
        <div className="popular-cards-grid">
          {products.map((p) => {
            const isWishlisted = wishlistIds ? wishlistIds.has(p._id) : false;
            const hasDiscount = p.discount > 0;
            const finalPrice = hasDiscount ? p.discountedPrice : p.productPrice;

            return (
              <div className="popular-clean-card" key={p._id}>
                <div className="popular-img-wrapper">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.productName} className="popular-img" />
                  ) : (
                    <div className="popular-img-fallback">📦</div>
                  )}

                  {/* Clean Wishlist Heart */}
                  <button
                    type="button"
                    className={`popular-heart-btn ${isWishlisted ? 'active' : ''}`}
                    onClick={() => toggleWishlist && toggleWishlist(p._id)}
                    title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke={isWishlisted ? '#ef4444' : '#64748b'} strokeWidth="2.2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>

                  {hasDiscount && (
                    <span className="popular-discount-tag">-{p.discount}%</span>
                  )}
                </div>

                <div className="popular-card-body">
                  <div className="popular-stars-row">
                    <span className="stars-amber">★★★★★</span>
                    <span className="rating-num">({p.averageRating || 4.8})</span>
                  </div>

                  <Link to="/products" className="popular-title-link">
                    <h3 className="popular-product-title">{p.productName}</h3>
                  </Link>

                  <div className="popular-price-row">
                    <span className="popular-main-price">₹{finalPrice?.toLocaleString()}</span>
                    {hasDiscount && (
                      <span className="popular-old-price">₹{p.productPrice?.toLocaleString()}</span>
                    )}

                    <button
                      type="button"
                      className="popular-quick-add-btn"
                      onClick={() => addToCart && addToCart(p._id)}
                      disabled={addingToCartId === p._id}
                      title="Add to cart"
                    >
                      {addingToCartId === p._id ? '✓' : '+ Add'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

