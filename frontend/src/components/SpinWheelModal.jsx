import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './SpinWheelModal.css';

const SECTORS = [
  { label: '15% OFF', sub: 'SPIN15', color: '#fed7aa', textColor: '#9a3412', icon: '🎟️' },
  { label: 'FREE SHIP', sub: 'FREESHIP', color: '#bbf7d0', textColor: '#166534', icon: '🚚' },
  { label: '₹150 OFF', sub: 'LUCKY150', color: '#fef08a', textColor: '#854d0e', icon: '💰' },
  { label: '100 COINS', sub: 'COINS100', color: '#e9d5ff', textColor: '#6b21a8', icon: '🪙' },
  { label: '20% OFF', sub: 'MEGA20', color: '#fbcfe8', textColor: '#9d174d', icon: '🎁' },
  { label: '50 COINS', sub: 'COINS50', color: '#bae6fd', textColor: '#075985', icon: '🌟' },
];

export default function SpinWheelModal({ isOpen, onClose }) {
  const { token, user, updateUser, refreshUser } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setWonPrize(null);
      setErrorMsg('');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSpin = async () => {
    if (spinning) return;
    if (!token) {
      setErrorMsg('Please login to spin the wheel and claim rewards.');
      return;
    }
    setErrorMsg('');
    setSpinning(true);
    setWonPrize(null);

    try {
      const res = await fetch('/api/personal/spin-wheel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Could not spin the wheel.');
        setSpinning(false);
        return;
      }

      const winningIndex = data.winningIndex ?? Math.floor(Math.random() * SECTORS.length);
      const prize = data.prize || SECTORS[winningIndex];

      // Calculate smooth rotational physics: 6 full revolutions + segment offset
      const segmentArc = 360 / SECTORS.length;
      const targetSectorCenter = winningIndex * segmentArc + segmentArc / 2;
      const totalDegrees = 360 * 6 + (360 - targetSectorCenter);

      setRotation(totalDegrees);

      // Wait 4s for animation to complete
      setTimeout(() => {
        setSpinning(false);
        setWonPrize(prize);
        if (data.totalCoins !== undefined) {
          updateUser({ rewardCoins: data.totalCoins });
        }
        refreshUser();
      }, 4000);
    } catch {
      setErrorMsg('Failed to connect to spin server.');
      setSpinning(false);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const streakCount = user?.dailyStreak?.count || 1;
  const coinsCount = user?.rewardCoins || 50;

  return (
    <div className="spin-overlay" onClick={onClose}>
      <div className="spin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Topbar */}
        <div className="spin-topbar">
          <div className="spin-streak-pill">
            <span>🔥</span> Day {streakCount} Streak
          </div>
          <div className="spin-coins-pill">
            🪙 {coinsCount} Coins
          </div>
          <button type="button" className="spin-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="spin-body">
          <h2 className="spin-headline">Spin & Win Rewards</h2>
          <p className="spin-subtext">
            Free daily spin! Win exclusive promo codes, delivery vouchers, and bonus coins.
          </p>

          {/* Wheel Graphic */}
          <div className="wheel-wrapper">
            <div className="wheel-pointer"></div>

            <div
              className="wheel-circle"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4s cubic-bezier(0.12, 0.8, 0.2, 1)' : 'none',
              }}
            >
              <svg viewBox="0 0 300 300" width="100%" height="100%">
                {SECTORS.map((sector, idx) => {
                  const angle = 60; // 360 / 6
                  const startAngle = idx * angle;
                  const endAngle = startAngle + angle;

                  const rad = (deg) => (deg * Math.PI) / 180;
                  const x1 = 150 + 150 * Math.cos(rad(startAngle));
                  const y1 = 150 + 150 * Math.sin(rad(startAngle));
                  const x2 = 150 + 150 * Math.cos(rad(endAngle));
                  const y2 = 150 + 150 * Math.sin(rad(endAngle));

                  const pathData = `M 150 150 L ${x1} ${y1} A 150 150 0 0 1 ${x2} ${y2} Z`;

                  // Text rotation angle
                  const midAngle = startAngle + angle / 2;

                  return (
                    <g key={idx}>
                      <path d={pathData} fill={sector.color} stroke="#ffffff" strokeWidth="2" />
                      <g
                        transform={`translate(150,150) rotate(${midAngle}) translate(78, 0) rotate(90)`}
                      >
                        <text
                          textAnchor="middle"
                          fill={sector.textColor}
                          fontSize="11"
                          fontWeight="900"
                          fontFamily="sans-serif"
                        >
                          {sector.icon} {sector.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>

              <div className="wheel-center-cap">★</div>
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}

          {!wonPrize ? (
            <button
              type="button"
              className="spin-action-btn"
              onClick={handleSpin}
              disabled={spinning}
            >
              {spinning ? 'SPINNING...' : '🎯 SPIN NOW'}
            </button>
          ) : (
            <div className="spin-winner-card">
              <div className="winner-emoji">🎉</div>
              <h3 className="winner-title">{wonPrize.title || wonPrize.label}</h3>
              {wonPrize.code && (
                <div>
                  <div className="winner-code-box">
                    <span>{wonPrize.code}</span>
                    <button
                      type="button"
                      className="copy-code-btn"
                      onClick={() => handleCopyCode(wonPrize.code)}
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '700' }}>
                    Saved to your account! You can apply it anytime at checkout.
                  </p>
                </div>
              )}
              {wonPrize.discountType === 'coins' && (
                <p style={{ fontSize: '0.85rem', color: '#854d0e', fontWeight: '800' }}>
                  +{wonPrize.discountValue} Coins added to your balance!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

