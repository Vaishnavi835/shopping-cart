import React from 'react';
import './FreeDeliveryBar.css';

export default function FreeDeliveryBar({ currentAmount = 0, threshold = 1000 }) {
  const amount = Number(currentAmount) || 0;
  const isFree = amount >= threshold;
  const remaining = Math.max(0, threshold - amount);
  const percent = Math.min(100, Math.round((amount / threshold) * 100));

  return (
    <div className={`free-delivery-container ${isFree ? 'free-delivery-unlocked' : ''}`}>
      <div className="free-delivery-text-row">
        <span className="free-delivery-message">
          <span className="free-delivery-truck">{isFree ? '🎉' : '🚚'}</span>
          {isFree ? (
            <span>You've unlocked <strong>FREE Express Delivery</strong>!</span>
          ) : (
            <span>
              Add <strong>₹{remaining.toLocaleString()}</strong> more for <strong>FREE Delivery</strong>
            </span>
          )}
        </span>
        <span className="free-delivery-percent">
          {isFree ? '100% UNLOCKED' : `${percent}%`}
        </span>
      </div>

      <div className="free-delivery-track">
        <div
          className="free-delivery-fill"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}

