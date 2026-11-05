import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  showToast,
}) {
  const { token, authFetch } = useAuth();
  const [cheaperAlternatives, setCheaperAlternatives] = useState([]);
  const [loadingCheaper, setLoadingCheaper] = useState(false);
  const [subscribedRestock, setSubscribedRestock] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Fetch cheaper alternatives when modal opens
  useEffect(() => {
    if (!product || !isOpen) return;

    setLoadingCheaper(true);
    authFetch(`/api/smart/cheaper/${product._id}`)
      .then((res) => res.json())
      .then((data) => {
        setCheaperAlternatives(data.cheaperAlternatives || []);
      })
      .catch(() => {})
      .finally(() => setLoadingCheaper(false));

    // Also track as recently viewed
    authFetch(`/api/personal/recently-viewed/${product._id}`, { method: 'POST' }).catch(() => {});
  }, [product, isOpen, authFetch]);

  if (!isOpen || !product) return null;

  const isOutOfStock = product.quantity === 0;
  const isLowStock = product.quantity > 0 && product.quantity < 5;
  const hasDiscount = product.discount > 0;
  const finalPrice = hasDiscount ? product.discountedPrice : product.productPrice;

  // Handle restock notification subscription
  const handleRestockNotify = async () => {
    setSubscribing(true);
    try {
      const res = await authFetch(`/api/personal/restock-notify/${product._id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribedRestock(true);
        showToast('🔔 We will notify you as soon as this item is restocked!');
      } else {
        showToast(data.message || 'Error subscribing to restock');
      }
    } catch {
      showToast('Error subscribing to notification');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="myntra-modal-overlay" onClick={onClose}>
      <div className="quickview-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-icon" onClick={onClose}>
          ✕
        </button>

        <div className="quickview-body-grid">
          {/* Left Column: Product Image */}
          <div className="quickview-image-col">
            <div className="quickview-img-box">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.productName} />
              ) : (
                <div className="quickview-img-fallback">📦</div>
              )}
              {hasDiscount && (
                <div className="myntra-discount-ribbon">{product.discount}% OFF</div>
              )}
            </div>
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="quickview-info-col">
            <div className="quickview-brand-tag">{product.category}</div>
            <h2 className="quickview-title">{product.productName}</h2>

            {/* Rating pill */}
            <div className="quickview-rating-row">
              <span className="myntra-rating-pill">
                <span className="rating-score">{product.averageRating || 0}</span>
                <span className="rating-star">★</span>
                <span className="rating-divider">|</span>
                <span className="rating-reviews-count">{product.ratings?.length || 0} Verified Ratings</span>
              </span>
            </div>

            {/* Price display */}
            <div className="quickview-price-section">
              <span className="discounted-price" style={{ fontSize: '1.8rem' }}>
                ₹{finalPrice?.toLocaleString()}
              </span>
              {hasDiscount && (
                <>
                  <span className="original-striked-price" style={{ fontSize: '1.2rem' }}>
                    ₹{product.productPrice?.toLocaleString()}
                  </span>
                  <span className="discount-percent-tag" style={{ fontSize: '1.05rem' }}>
                    ({product.discount}% OFF)
                  </span>
                </>
              )}
              <div style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 600, marginTop: 4 }}>
                inclusive of all taxes
              </div>
            </div>

            {/* Stock status alerts */}
            <div className="quickview-stock-alert">
              {isOutOfStock ? (
                <div className="stock-alert-banner out-of-stock">
                  <span>❌ Currently Out of Stock</span>
                  <button
                    type="button"
                    className="restock-notify-btn"
                    onClick={handleRestockNotify}
                    disabled={subscribing || subscribedRestock}
                  >
                    {subscribedRestock ? '✅ Alert Set' : '🔔 Notify Me on Restock'}
                  </button>
                </div>
              ) : isLowStock ? (
                <div className="stock-alert-banner low-stock">
                  <span>⚠️ Hurry! Only {product.quantity} items left in stock</span>
                </div>
              ) : (
                <div className="stock-alert-banner in-stock">
                  <span>✅ In Stock ({product.quantity} units ready to ship)</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="quickview-desc">
              <h4>Product Details</h4>
              <p>{product.description || 'Crafted with premium materials for timeless comfort and trendsetting flair.'}</p>
            </div>

            {/* Action buttons */}
            <div className="quickview-actions">
              <button
                type="button"
                className="myntra-btn-primary"
                style={{ flex: 1.5, padding: '14px', fontSize: '1rem' }}
                disabled={isOutOfStock}
                onClick={() => {
                  onAddToCart(product._id);
                  onClose();
                }}
              >
                {isOutOfStock ? 'OUT OF STOCK' : '🛍️ ADD TO BAG'}
              </button>
              <button
                type="button"
                className={`myntra-btn-outline ${isWishlisted ? 'active-wishlist' : ''}`}
                style={{ flex: 1, padding: '14px', fontSize: '0.95rem' }}
                onClick={() => onToggleWishlist(product._id)}
              >
                {isWishlisted ? '❤️ WISHLISTED' : '🤍 WISHLIST'}
              </button>
            </div>

            {/* 🌟 CHEAPER ALTERNATIVES SECTION */}
            <div className="cheaper-alternatives-section">
              <div className="cheaper-header">
                <h4>💡 Cheaper Alternatives in {product.category}</h4>
                <span className="cheaper-sub">SmartCart suggestions to save money</span>
              </div>

              {loadingCheaper ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted, #888)' }}>
                  Finding lower priced options...
                </div>
              ) : cheaperAlternatives.length === 0 ? (
                <div className="cheaper-none">
                  🎉 Great choice! This is already the most budget-friendly product in this category.
                </div>
              ) : (
                <div className="cheaper-cards-row">
                  {cheaperAlternatives.slice(0, 3).map((alt) => {
                    const altDiscounted = alt.discount > 0
                      ? alt.productPrice * (1 - alt.discount / 100)
                      : alt.productPrice;
                    const savings = Math.max(0, finalPrice - altDiscounted);

                    return (
                      <div key={alt._id} className="cheaper-card">
                        <div className="cheaper-thumb">
                          {alt.imageUrl ? (
                            <img src={alt.imageUrl} alt={alt.productName} />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                        <div className="cheaper-card-details">
                          <div className="cheaper-card-title">{alt.productName}</div>
                          <div className="cheaper-price-line">
                            <span className="cheaper-price">₹{altDiscounted.toFixed(0)}</span>
                            {savings > 0 && (
                              <span className="cheaper-savings">Save ₹{savings.toFixed(0)}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="cheaper-add-btn"
                            disabled={alt.quantity === 0}
                            onClick={() => {
                              onAddToCart(alt._id);
                              showToast(`Added cheaper alternative (${alt.productName})!`);
                            }}
                          >
                            + Add Alternative
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

