import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './SizeFitPredictor.css';

export default function SizeFitPredictor({ productId, category }) {
  const { token, user, updateUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTuning, setShowTuning] = useState(false);
  const [tuneForm, setTuneForm] = useState({
    height: 172,
    weight: 68,
    preferredFit: 'regular',
  });
  const [savingTune, setSavingTune] = useState(false);

  // Check if product is apparel/footwear
  const cat = (category || '').toLowerCase();
  const isEligible =
    cat.includes('clothing') ||
    cat.includes('shirt') ||
    cat.includes('dress') ||
    cat.includes('top') ||
    cat.includes('footwear') ||
    cat.includes('shoe');

  const fetchPrediction = useCallback(async () => {
    if (!productId) return;
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/personal/size-predictor/${productId}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.sizingProfile) {
          setTuneForm({
            height: json.sizingProfile.height || 172,
            weight: json.sizingProfile.weight || 68,
            preferredFit: json.sizingProfile.preferredFit || 'regular',
          });
        }
      }
    } catch {
      // Sizing predictor graceful fallback
    } finally {
      setLoading(false);
    }
  }, [productId, token]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  const handleSaveTuning = async (e) => {
    e.preventDefault();
    setSavingTune(true);
    try {
      if (token) {
        const res = await fetch('/api/personal/sizing-profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(tuneForm),
        });
        if (res.ok) {
          const resData = await res.json();
          updateUser({ sizingProfile: resData.sizingProfile });
        }
      }
      setShowTuning(false);
      fetchPrediction();
    } catch {
      // fallback
    } finally {
      setSavingTune(false);
    }
  };

  if (!isEligible && !data?.isClothingOrFootwear) {
    return null; // Only show for clothing and footwear
  }

  if (loading) {
    return (
      <div className="size-predictor-card" style={{ opacity: 0.7 }}>
        <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>✨ Analyzing fit & returns data...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="size-predictor-card">
      <div className="size-predictor-header">
        <div className="predictor-title-group">
          <div className="predictor-radar-icon">📏</div>
          <span className="predictor-title">Smart Size & Fit Predictor</span>
        </div>
        <span className="predictor-confidence-badge">
          ✓ {data.confidence}% Fit Confidence
        </span>
      </div>

      <div className="predictor-result-row">
        <div className="predicted-size-bubble">{data.recommendedSize}</div>
        <div className="predicted-size-meta">
          <div className="predicted-headline">
            Recommended Best Fit: <strong>Size {data.recommendedSize}</strong>
          </div>
          <div className="predicted-fit-tip">{data.fitTip}</div>
        </div>
      </div>

      {data.reasons && data.reasons.length > 0 && (
        <div className="predictor-reasons-list">
          {data.reasons.map((reason, idx) => (
            <div key={idx} className="predictor-reason-item">
              <span className="reason-bullet">✓</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}

      <div className="predictor-actions-row">
        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
          Calibrated to {data.sizingProfile?.height}cm / {data.sizingProfile?.weight}kg ({data.sizingProfile?.preferredFit})
        </span>
        <button
          type="button"
          className="tune-measurements-btn"
          onClick={() => setShowTuning(!showTuning)}
        >
          {showTuning ? 'Close' : 'Adjust Measurements'}
        </button>
      </div>

      {showTuning && (
        <form onSubmit={handleSaveTuning} className="predictor-tuning-drawer">
          <div className="tuning-grid">
            <div className="tuning-field">
              <label>Height (cm)</label>
              <input
                type="number"
                min="120"
                max="230"
                value={tuneForm.height}
                onChange={(e) => setTuneForm({ ...tuneForm, height: e.target.value })}
              />
            </div>
            <div className="tuning-field">
              <label>Weight (kg)</label>
              <input
                type="number"
                min="35"
                max="180"
                value={tuneForm.weight}
                onChange={(e) => setTuneForm({ ...tuneForm, weight: e.target.value })}
              />
            </div>
            <div className="tuning-field">
              <label>Fit Style</label>
              <select
                value={tuneForm.preferredFit}
                onChange={(e) => setTuneForm({ ...tuneForm, preferredFit: e.target.value })}
              >
                <option value="slim">Slim Fit</option>
                <option value="regular">Regular Fit</option>
                <option value="relaxed">Relaxed Fit</option>
                <option value="oversized">Oversized</option>
              </select>
            </div>
          </div>
          <button type="submit" className="tuning-save-btn" disabled={savingTune}>
            {savingTune ? 'Recalibrating...' : 'Update & Recalculate Size'}
          </button>
        </form>
      )}
    </div>
  );
}

