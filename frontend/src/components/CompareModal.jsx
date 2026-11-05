import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function CompareModal({ isOpen, onClose, onAddToCart }) {
  const { compareItems, removeFromCompare, clearCompare } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="shop-modal-overlay" onClick={onClose}>
      <div className="compare-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              ⚖️ Smart Product Comparison
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>
              Comparing {compareItems.length} of 3 selected products
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <button
              type="button"
              className="shop-btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              onClick={clearCompare}
            >
              Clear All
            </button>
            <button type="button" className="modal-close-icon" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {compareItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚖️</div>
            <h4>No products selected for comparison</h4>
            <p style={{ color: 'var(--text-muted, #64748b)' }}>
              Click the "Compare" button on any product card to compare up to 3 items side by side.
            </p>
          </div>
        ) : (
          <div className="compare-table-wrapper">
            <table className="compare-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Attribute</th>
                  {compareItems.map((p) => (
                    <th key={p._id} className="compare-col-header">
                      <div className="compare-img-wrap">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.productName} />
                        ) : (
                          <div className="compare-placeholder">📦</div>
                        )}
                        <button
                          type="button"
                          className="compare-remove-btn"
                          title="Remove from comparison"
                          onClick={() => removeFromCompare(p._id)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="compare-item-name">{p.productName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price & Discount */}
                <tr>
                  <td className="attribute-label">Effective Price</td>
                  {compareItems.map((p) => {
                    const hasDiscount = p.discount > 0;
                    const finalPrice = hasDiscount ? p.discountedPrice : p.productPrice;
                    return (
                      <td key={p._id}>
                        <div style={{ fontWeight: 800, color: '#ff3e6c', fontSize: '1.15rem' }}>
                          ₹{finalPrice?.toLocaleString()}
                        </div>
                        {hasDiscount && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #888)' }}>
                            <span style={{ textDecoration: 'line-through' }}>₹{p.productPrice?.toLocaleString()}</span>
                            <span style={{ color: '#059669', marginLeft: 6, fontWeight: 700 }}>
                              {p.discount}% OFF
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Category */}
                <tr>
                  <td className="attribute-label">Category</td>
                  {compareItems.map((p) => (
                    <td key={p._id}>
                      <span className="badge-category">{p.category}</span>
                    </td>
                  ))}
                </tr>

                {/* Stock & Availability */}
                <tr>
                  <td className="attribute-label">Stock Status</td>
                  {compareItems.map((p) => (
                    <td key={p._id}>
                      {p.quantity === 0 ? (
                        <span className="stock-pill stock-out">Out of Stock</span>
                      ) : p.quantity < 5 ? (
                        <span className="stock-pill stock-low">⚠️ Only {p.quantity} Left!</span>
                      ) : (
                        <span className="stock-pill stock-ok">✅ In Stock ({p.quantity})</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Customer Rating */}
                <tr>
                  <td className="attribute-label">Customer Rating</td>
                  {compareItems.map((p) => (
                    <td key={p._id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★</span>
                        <span style={{ fontWeight: 700 }}>{p.averageRating || 'Unrated'}</span>
                        <span style={{ color: 'var(--text-muted, #888)', fontSize: '0.8rem' }}>
                          ({p.ratings?.length || 0} reviews)
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Description */}
                <tr>
                  <td className="attribute-label">Description</td>
                  {compareItems.map((p) => (
                    <td key={p._id} className="compare-desc-cell">
                      <p>{p.description || 'Premium quality selection.'}</p>
                    </td>
                  ))}
                </tr>

                {/* Action Row */}
                <tr>
                  <td className="attribute-label">Action</td>
                  {compareItems.map((p) => (
                    <td key={p._id}>
                      <button
                        type="button"
                        className="shop-bag-btn"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={p.quantity === 0}
                        onClick={() => {
                          onAddToCart(p._id);
                          onClose();
                        }}
                      >
                        {p.quantity === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Floating Compare Tray at the bottom of the screen
export function CompareTray({ onOpenModal }) {
  const { compareItems, removeFromCompare, clearCompare } = useAuth();

  if (compareItems.length === 0) return null;

  return (
    <div className="floating-compare-tray">
      <div className="compare-tray-left">
        <span className="tray-badge">{compareItems.length} / 3</span>
        <span className="tray-title">Products to Compare</span>
        <div className="tray-thumbs">
          {compareItems.map((p) => (
            <div key={p._id} className="tray-thumb-wrap" title={p.productName}>
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.productName} />
              ) : (
                <span>📦</span>
              )}
              <button
                type="button"
                className="tray-thumb-remove"
                onClick={() => removeFromCompare(p._id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="compare-tray-right">
        <button type="button" className="shop-btn-outline tray-btn" onClick={clearCompare}>
          Clear
        </button>
        <button type="button" className="shop-btn-primary tray-btn" onClick={onOpenModal}>
          Compare Now ({compareItems.length})
        </button>
      </div>
    </div>
  );
}

