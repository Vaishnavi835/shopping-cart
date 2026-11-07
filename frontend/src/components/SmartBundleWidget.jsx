import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './SmartBundleWidget.css';

export default function SmartBundleWidget({ productId, onToast }) {
  const { token, refreshCartCount } = useAuth();
  const [bundle, setBundle] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [adding, setAdding] = useState(false);

  const fetchBundle = useCallback(async () => {
    try {
      const url = productId ? `/api/smart/bundles/${productId}` : '/api/smart/bundles';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBundle(data);
        if (data.items) {
          setSelectedIds(data.items.map((i) => i._id));
        }
      }
    } catch {
      // Graceful error fallback
    }
  }, [productId]);

  useEffect(() => {
    fetchBundle();
  }, [fetchBundle]);

  if (!bundle || !bundle.items || bundle.items.length < 2) return null;

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return; // Keep at least one
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Recalculate dynamic bundle pricing based on active selected checkboxes
  const activeItems = bundle.items.filter((item) => selectedIds.includes(item._id));
  const calcDiscounted = (p) => p.productPrice * (1 - (p.discount || 0) / 100);
  const rawSum = activeItems.reduce((acc, p) => acc + calcDiscounted(p), 0);
  const discountRate = activeItems.length >= 2 ? bundle.bundleDiscountPercent : 0;
  const bundleFinalPrice = rawSum * (1 - discountRate / 100);
  const totalSavings = rawSum - bundleFinalPrice;

  const handleAddBundle = async () => {
    if (!token) {
      if (onToast) onToast('⚠️ Please login to add items to cart.');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/smart/add-bundle-to-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds: selectedIds }),
      });
      if (res.ok) {
        await refreshCartCount();
        if (onToast) onToast(`🎉 Added ${activeItems.length} items to your cart with Bundle Savings!`);
      }
    } catch {
      if (onToast) onToast('Failed to add bundle to cart.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="smart-bundle-wrapper">
      <div className="bundle-top-row">
        <div className="bundle-heading-group">
          <span className="bundle-sparkle-pill">✨ Smart Bundle</span>
          <h3 className="bundle-title">{bundle.bundleTheme || 'Complete the Look'}</h3>
        </div>
        <span className="bundle-discount-badge">
          Save extra {bundle.bundleDiscountPercent}% when bought together
        </span>
      </div>

      <div className="bundle-chain-container">
        {bundle.items.map((item, index) => {
          const isChecked = selectedIds.includes(item._id);
          const itemPrice = (item.productPrice * (1 - (item.discount || 0) / 100)).toFixed(0);
          return (
            <React.Fragment key={item._id}>
              <div
                className="bundle-item-card"
                style={{ opacity: isChecked ? 1 : 0.6 }}
              >
                <input
                  type="checkbox"
                  className="bundle-item-checkbox"
                  checked={isChecked}
                  onChange={() => toggleSelect(item._id)}
                  title="Include in bundle"
                />
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="bundle-item-thumb"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span className="bundle-item-cat">{item.category}</span>
                <h4 className="bundle-item-name" title={item.productName}>
                  {item.productName}
                </h4>
                <span className="bundle-item-price">₹{Number(itemPrice).toLocaleString()}</span>
              </div>

              {index < bundle.items.length - 1 && (
                <span className="bundle-plus-separator">+</span>
              )}
            </React.Fragment>
          );
        })}

        <span className="bundle-plus-separator">=</span>

        {/* Summary Card */}
        <div className="bundle-summary-card">
          <span className="summary-bundle-tag">
            {activeItems.length}-Piece Look
          </span>
          <div className="summary-price-row">
            <span className="summary-bundle-price">
              ₹{bundleFinalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            {discountRate > 0 && (
              <span className="summary-orig-price">
                ₹{rawSum.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            )}
          </div>
          {totalSavings > 0 && (
            <span className="summary-savings-text">
              ✨ You save ₹{totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({discountRate}%)
            </span>
          )}
          <button
            type="button"
            className="bundle-add-btn"
            onClick={handleAddBundle}
            disabled={adding || activeItems.length === 0}
          >
            {adding ? 'Adding Bundle...' : '⚡ Add Complete Look to Bag'}
          </button>
        </div>
      </div>
    </div>
  );
}

