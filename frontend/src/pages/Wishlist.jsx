import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';

export default function Wishlist() {
  const { token, setCartCount } = useAuth();
  const { toast, showToast } = useToast();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchWishlist = () => {
    fetch('/api/wishlist', { headers: authHeader })
      .then((r) => r.json())
      .then((data) => setWishlist(data.wishlist || []))
      .finally(() => setLoading(false));
  };

  useEffect(fetchWishlist, []);

  const removeFromWishlist = async (productId) => {
    await fetch(`/api/wishlist/${productId}`, { method: 'DELETE', headers: authHeader });
    showToast('Removed from wishlist');
    fetchWishlist();
  };

  const moveToCart = async (productId) => {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const data = await res.json();
    if (res.ok) {
      setCartCount(data.cart.reduce((s, i) => s + i.quantity, 0));
      await fetch(`/api/wishlist/${productId}`, { method: 'DELETE', headers: authHeader });
      showToast('✅ Moved to cart!');
      fetchWishlist();
    } else {
      showToast('❌ ' + data.message);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="wishlist-page">
      <h2 style={{ marginBottom: '1.5rem', color: '#1a1a2e' }}>❤️ My Wishlist</h2>

      {wishlist.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🤍</div>
          <h3>Your wishlist is empty</h3>
          <p>Save items you love for later!</p>
        </div>
      ) : (
        <div className="products-grid">
          {wishlist.map((p) => (
            <div className="product-card" key={p._id}>
              {p.imageUrl && <img src={p.imageUrl} alt={p.productName} />}
              <div className="card-body">
                <div className="card-category">{p.category}</div>
                <h3>{p.productName}</h3>
                <div className="price-row">
                  <span className="price">₹{p.productPrice?.toLocaleString()}</span>
                </div>
                <div className={`stock ${p.quantity < 5 ? 'low' : ''}`}>
                  {p.quantity === 0 ? '❌ Out of Stock' : `✅ ${p.quantity} in stock`}
                </div>
                <div className="card-actions" style={{ marginTop: '0.8rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => moveToCart(p._id)}
                    disabled={p.quantity === 0}>
                    🛒 Move to Cart
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeFromWishlist(p._id)}>
                    🗑️ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}

