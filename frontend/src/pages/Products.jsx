import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';
import CompareModal, { CompareTray } from '../components/CompareModal';
import QuickViewModal from '../components/QuickViewModal';

// Star rating display component
function Stars({ rating }) {
  return (
    <span className="myntra-stars-inline">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(rating) ? '#14958f' : '#e2e8f0' }}>★</span>
      ))}
      <span className="myntra-rating-count">({rating})</span>
    </span>
  );
}

// Review Modal
function ReviewModal({ product, token, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [hovered, setHovered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please select a star rating.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, review }),
      });
      const data = await res.json();
      if (res.ok) {
        onSubmitted(data.message || 'Review submitted successfully!');
        onClose();
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="myntra-modal-overlay" onClick={onClose}>
      <div className="myntra-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h3>Customer Review</h3>
            <p className="modal-product-title">{product.productName}</p>
          </div>
          <button type="button" className="modal-close-icon" onClick={onClose}>✕</button>
        </div>

        {error && <div className="myntra-alert-error">{error}</div>}

        <div className="rating-select-group">
          <label>Your Rating</label>
          <div className="star-rating-interactive">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                className={`star-choice ${(hovered || rating) >= s ? 'selected' : ''}`}
              >
                ★
              </span>
            ))}
            <span className="rating-text-label">
              {hovered || rating} out of 5 Stars
            </span>
          </div>
        </div>

        <div className="review-input-group">
          <label>Write a Review (Optional)</label>
          <textarea
            placeholder="Share your experience with this product: quality, fit, style..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
          />
        </div>

        <div className="modal-actions-row">
          <button
            type="button"
            className="myntra-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
          <button
            type="button"
            className="myntra-btn-outline"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const {
    token,
    authFetch,
    setCartCount,
    compareItems,
    addToCompare,
    removeFromCompare,
  } = useAuth();
  const { toast, showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // 🌟 Feature 22: Best Value IDs
  const [bestValueIds, setBestValueIds] = useState(new Set());
  const [onlyBestValue, setOnlyBestValue] = useState(false);

  // Modals state
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || 'All';
  const urlSearch = searchParams.get('search') || '';

  // Filter & Search states
  const [search, setSearch] = useState(urlSearch);
  const [category, setCategory] = useState(urlCategory);
  const [sort, setSort] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [minDiscount, setMinDiscount] = useState(0);

  // Sync state when URL searchParams change
  useEffect(() => {
    const cat = searchParams.get('category') || 'All';
    setCategory(cat);
    const q = searchParams.get('search') || '';
    setSearch(q);
  }, [searchParams]);

  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [reviewProduct, setReviewProduct] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);

  const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  // Fetch unique categories
  useEffect(() => {
    fetch('/api/products/categories', { headers: authHeader })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.categories) {
          setCategories(['All', ...data.categories]);
        }
      })
      .catch((err) => console.warn('Categories load error:', err));
  }, [authHeader]);

  // Fetch wishlist (only if user is logged in)
  useEffect(() => {
    if (!token) return;
    fetch('/api/wishlist', { headers: authHeader })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.wishlist) {
          setWishlistIds(new Set(data.wishlist.map((p) => p._id)));
        }
      })
      .catch((err) => console.warn('Wishlist load error:', err));
  }, [authHeader, token]);

  // Fetch best value indicator products
  useEffect(() => {
    authFetch('/api/smart/best-value')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.bestValueProducts) {
          setBestValueIds(new Set(data.bestValueProducts.map((p) => p._id)));
        }
      })
      .catch((err) => console.warn('Best value load error:', err));
  }, [authFetch]);

  // Fetch products from backend with timeout and safety
  const fetchProducts = useCallback(() => {
    setLoading(true);
    setFetchError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (category && category !== 'All') params.set('category', category);
    if (sort) params.set('sort', sort);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    const qs = params.toString();
    const url = qs ? `/api/products?${qs}` : '/api/products';

    fetch(url, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData.message || `Server error (${r.status})`);
        }
        return r.json();
      })
      .then((data) => {
        setProducts(data.products || []);
        setFetchError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          console.warn('Products fetch timed out');
          setFetchError('Request timed out. Please check that the server is running.');
        } else {
          console.error('Products fetch error:', err);
          setFetchError(err.message || 'Failed to load products');
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sort, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Client-side filtering for extra Myntra filters (rating & discount & best value)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (onlyBestValue && !bestValueIds.has(p._id)) return false;
      const avg = Number(p.averageRating) || 0;
      if (minRating > 0 && avg < minRating) return false;
      if (minDiscount > 0 && (p.discount || 0) < minDiscount) return false;
      return true;
    });
  }, [products, minRating, minDiscount, onlyBestValue, bestValueIds]);

  // Add item to cart
  const addToCart = async (productId) => {
    setAddingToCartId(productId);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        setCartCount(data.cart.reduce((sum, i) => sum + i.quantity, 0));
        showToast('🛍️ Added to your bag!');
      } else {
        showToast('❌ ' + data.message);
      }
    } catch {
      showToast('❌ Network error');
    } finally {
      setAddingToCartId(null);
    }
  };

  // Toggle wishlist
  const toggleWishlist = async (productId) => {
    if (wishlistIds.has(productId)) {
      try {
        await fetch(`/api/wishlist/${productId}`, { method: 'DELETE', headers: authHeader });
        setWishlistIds((prev) => {
          const s = new Set(prev);
          s.delete(productId);
          return s;
        });
        showToast('Removed from Wishlist');
      } catch {
        showToast('Error updating wishlist');
      }
    } else {
      try {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ productId }),
        });
        setWishlistIds((prev) => new Set([...prev, productId]));
        showToast('❤️ Added to Wishlist');
      } catch {
        showToast('Error adding to wishlist');
      }
    }
  };

  // Toggle product compare
  const toggleCompare = (product) => {
    const isCompared = compareItems.some((i) => i._id === product._id);
    if (isCompared) {
      removeFromCompare(product._id);
      showToast(`Removed ${product.productName} from compare`);
    } else {
      if (compareItems.length >= 3) {
        showToast('Maximum 3 products can be compared at once');
      } else {
        addToCompare(product);
        showToast(`Added ${product.productName} to compare`);
      }
    }
  };

  // Restock notify direct subscription
  const handleRestockNotify = async (productId, productName) => {
    try {
      const res = await authFetch(`/api/personal/restock-notify/${productId}`, { method: 'POST' });
      if (res.ok) {
        showToast(`🔔 We'll notify you when ${productName} is back in stock!`);
      } else {
        showToast('Error setting restock alert');
      }
    } catch {
      showToast('Failed to set restock alert');
    }
  };

  const handleClearAll = () => {
    setSearch('');
    setCategory('All');
    setSort('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setMinDiscount(0);
    setOnlyBestValue(false);
  };

  return (
    <div className="myntra-products-page">
      {/* Breadcrumb Header Row */}
      <div className="myntra-breadcrumb-row">
        <span className="breadcrumb-link">Home</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-link">Products</span>
        {category !== 'All' && (
          <>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{category}</span>
          </>
        )}
        <span className="breadcrumb-count">
          - {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="myntra-topbar">
        <div className="myntra-search-box">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search for products, brands and more"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="clear-search-btn" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        {/* Best Value Quick Toggle */}
        <button
          type="button"
          className={`best-value-filter-chip ${onlyBestValue ? 'active' : ''}`}
          onClick={() => setOnlyBestValue(!onlyBestValue)}
          title="Highlight products with the best price, discount and ratings"
        >
          <span>🔥 Best Value Deals</span>
        </button>

        {/* Myntra Styled Sort Dropdown */}
        <div className="myntra-sort-box">
          <label className="sort-label">Sort by :</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">Recommended</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout: Sidebar Filters + Products Grid */}
      <div className="myntra-main-container">
        {/* Left Filter Sidebar */}
        <aside className="myntra-filter-sidebar">
          <div className="filter-header-bar">
            <span className="filter-title">FILTERS</span>
            {(category !== 'All' || minPrice || maxPrice || search || minRating > 0 || minDiscount > 0 || sort || onlyBestValue) && (
              <button type="button" className="clear-all-link" onClick={handleClearAll}>
                CLEAR ALL
              </button>
            )}
          </div>

          {/* Smart Filter: Best Value Deals */}
          <div className="filter-section">
            <div className="filter-section-title">SMART FILTERS</div>
            <label className="myntra-radio-option">
              <input
                type="checkbox"
                checked={onlyBestValue}
                onChange={(e) => setOnlyBestValue(e.target.checked)}
              />
              <span className="radio-label-text" style={{ fontWeight: 600, color: '#ff3e6c' }}>
                🔥 Best Value Only
              </span>
            </label>
          </div>

          {/* Categories Accordion */}
          <div className="filter-section">
            <div className="filter-section-title">CATEGORIES</div>
            <div className="filter-options-list">
              {categories.map((c) => (
                <label key={c} className="myntra-radio-option">
                  <input
                    type="radio"
                    name="category-choice"
                    checked={category === c}
                    onChange={() => setCategory(c)}
                  />
                  <span className="radio-label-text">{c}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <div className="filter-section-title">PRICE (₹)</div>
            <div className="price-inputs-row">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
              />
              <span className="price-to-separator">to</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
              />
            </div>
            {/* Quick Price Buttons */}
            <div className="quick-price-chips">
              <button
                type="button"
                className={`price-chip ${maxPrice === '1000' ? 'active' : ''}`}
                onClick={() => { setMinPrice('0'); setMaxPrice('1000'); }}
              >
                Under ₹1k
              </button>
              <button
                type="button"
                className={`price-chip ${minPrice === '1000' && maxPrice === '3000' ? 'active' : ''}`}
                onClick={() => { setMinPrice('1000'); setMaxPrice('3000'); }}
              >
                ₹1k - ₹3k
              </button>
              <button
                type="button"
                className={`price-chip ${minPrice === '3000' ? 'active' : ''}`}
                onClick={() => { setMinPrice('3000'); setMaxPrice(''); }}
              >
                ₹3k+
              </button>
            </div>
          </div>

          {/* Customer Rating Filter */}
          <div className="filter-section">
            <div className="filter-section-title">CUSTOMER RATING</div>
            <div className="filter-options-list">
              {[
                { val: 4, label: '4★ & above' },
                { val: 3, label: '3★ & above' },
                { val: 0, label: 'All Ratings' },
              ].map((r) => (
                <label key={r.val} className="myntra-radio-option">
                  <input
                    type="radio"
                    name="rating-choice"
                    checked={minRating === r.val}
                    onChange={() => setMinRating(r.val)}
                  />
                  <span className="radio-label-text">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Discount Range Filter */}
          <div className="filter-section">
            <div className="filter-section-title">DISCOUNT RANGE</div>
            <div className="filter-options-list">
              {[
                { val: 10, label: '10% and above' },
                { val: 20, label: '20% and above' },
                { val: 0, label: 'All Discounts' },
              ].map((d) => (
                <label key={d.val} className="myntra-radio-option">
                  <input
                    type="radio"
                    name="discount-choice"
                    checked={minDiscount === d.val}
                    onChange={() => setMinDiscount(d.val)}
                  />
                  <span className="radio-label-text">{d.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Product Grid Column */}
        <main className="myntra-product-main">
          {loading ? (
            <div className="myntra-loader">
              <div className="myntra-spinner"></div>
              <span>Loading catalogue...</span>
            </div>
          ) : fetchError ? (
            <div className="myntra-empty-state">
              <div className="empty-icon-wrap">⚠️</div>
              <h3>Unable to load catalogue</h3>
              <p>{fetchError}</p>
              <button type="button" className="myntra-btn-primary" onClick={fetchProducts}>
                🔄 Try Again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="myntra-empty-state">
              <div className="empty-icon-wrap">🛍️</div>
              <h3>We couldn't find any matches!</h3>
              <p>Please check the spelling or try resetting some of your filters</p>
              <button type="button" className="myntra-btn-primary" onClick={handleClearAll}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="myntra-grid">
              {filteredProducts.map((p) => {
                const isWishlisted = wishlistIds.has(p._id);
                const isCompared = compareItems.some((item) => item._id === p._id);
                const isBestValue = bestValueIds.has(p._id);
                const hasDiscount = p.discount > 0;
                const finalPrice = hasDiscount ? p.discountedPrice : p.productPrice;

                return (
                  <div className="myntra-card" key={p._id}>
                    {/* Top Image Container */}
                    <div className="myntra-image-wrapper">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.productName}
                          className="myntra-product-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="myntra-img-placeholder">
                          <span>📦</span>
                        </div>
                      )}

                      {/* Best Value Badge */}
                      {isBestValue && (
                        <div className="best-value-badge" title="Highest value score for discount & rating">
                          🔥 BEST VALUE
                        </div>
                      )}

                      {/* Quick View Hover Button */}
                      <button
                        type="button"
                        className="card-quickview-btn"
                        onClick={() => setQuickViewProduct(p)}
                        title="Quick View Details & Cheaper Alternatives"
                      >
                        👁️ Quick View
                      </button>

                      {/* Wishlist Heart Button */}
                      <button
                        type="button"
                        className={`myntra-wishlist-icon ${isWishlisted ? 'wishlisted' : ''}`}
                        onClick={() => toggleWishlist(p._id)}
                        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? '#ff3e6c' : 'none'} stroke={isWishlisted ? '#ff3e6c' : '#282c3f'} strokeWidth="2.2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      {/* Compare Checkbox Button */}
                      <button
                        type="button"
                        className={`myntra-compare-icon ${isCompared ? 'compared' : ''}`}
                        onClick={() => toggleCompare(p)}
                        title={isCompared ? 'Remove from comparison' : 'Compare product (up to 3)'}
                      >
                        ⚖️
                      </button>

                      {/* Rating Pill */}
                      {p.averageRating > 0 && (
                        <div className="myntra-rating-pill">
                          <span className="rating-score">{p.averageRating}</span>
                          <span className="rating-star">★</span>
                          <span className="rating-divider">|</span>
                          <span className="rating-reviews-count">{p.ratings?.length || 1}</span>
                        </div>
                      )}

                      {/* Discount Badge on Image */}
                      {hasDiscount && (
                        <div className="myntra-discount-ribbon">
                          {p.discount}% OFF
                        </div>
                      )}
                    </div>

                    {/* Card Content Details */}
                    <div className="myntra-card-details">
                      {/* Brand / Category */}
                      <div className="myntra-brand-name">
                        {p.category}
                      </div>

                      {/* Product Name Title */}
                      <h4
                        className="myntra-product-title"
                        title={p.productName}
                        onClick={() => setQuickViewProduct(p)}
                        style={{ cursor: 'pointer' }}
                      >
                        {p.productName}
                      </h4>

                      {/* Description truncated */}
                      <p className="myntra-product-desc">
                        {p.description || 'Premium lifestyle quality product'}
                      </p>

                      {/* Pricing Row */}
                      <div className="myntra-price-row">
                        <span className="discounted-price">
                          Rs. {finalPrice?.toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <>
                            <span className="original-striked-price">
                              Rs. {p.productPrice?.toLocaleString()}
                            </span>
                            <span className="discount-percent-tag">
                              ({p.discount}% OFF)
                            </span>
                          </>
                        )}
                      </div>

                      {/* Stock Urgency Tag & Restock Notification */}
                      {p.quantity === 0 ? (
                        <div className="stock-alert-row">
                          <span className="stock-alert out-of-stock">Out of Stock</span>
                          <button
                            type="button"
                            className="card-restock-btn"
                            onClick={() => handleRestockNotify(p._id, p.productName)}
                            title="Get alerted when back in stock"
                          >
                            🔔 Notify
                          </button>
                        </div>
                      ) : p.quantity < 5 ? (
                        <div className="stock-alert low-stock">⚠️ Only {p.quantity} left in stock!</div>
                      ) : null}

                      {/* Action Buttons: Add to Bag & Review */}
                      <div className="myntra-card-actions">
                        <button
                          type="button"
                          className="myntra-bag-btn"
                          onClick={() => addToCart(p._id)}
                          disabled={p.quantity === 0 || addingToCartId === p._id}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                          </svg>
                          <span>{addingToCartId === p._id ? 'ADDING...' : p.quantity === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}</span>
                        </button>

                        <button
                          type="button"
                          className="myntra-rate-btn"
                          onClick={() => setReviewProduct(p)}
                          title="Rate and write review"
                        >
                          ★ RATE
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* 🌟 Floating Product Comparison Tray */}
      <CompareTray onOpenModal={() => setCompareModalOpen(true)} />

      {/* 🌟 Comparison Modal */}
      <CompareModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        onAddToCart={addToCart}
      />

      {/* 🌟 Product Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        isWishlisted={quickViewProduct ? wishlistIds.has(quickViewProduct._id) : false}
        showToast={showToast}
      />

      {/* Review Modal */}
      {reviewProduct && (
        <ReviewModal
          product={reviewProduct}
          token={token}
          onClose={() => setReviewProduct(null)}
          onSubmitted={(msg) => showToast(msg)}
        />
      )}

      {/* Toast Alert */}
      <Toast message={toast} />
    </div>
  );
}
