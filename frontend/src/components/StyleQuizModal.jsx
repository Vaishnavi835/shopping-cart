import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './StyleQuizModal.css';

export default function StyleQuizModal({ isOpen, onClose, onCompleted }) {
  const { token, updateUser, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form selections
  const [selectedVibe, setSelectedVibe] = useState('Minimalist Modern');
  const [selectedPalette, setSelectedPalette] = useState('Pastels & Soft Tones');
  const [selectedCategories, setSelectedCategories] = useState(['Clothing', 'Footwear', 'Accessories']);
  const [selectedBudget, setSelectedBudget] = useState('Balanced');

  if (!isOpen) return null;

  const VIBES = [
    {
      id: 'Minimalist Modern',
      emoji: '🌿',
      name: 'Minimalist Modern',
      tagline: 'Clean lines, relaxed luxury, neutral soft palettes.',
    },
    {
      id: 'Urban Streetwear',
      emoji: '⚡',
      name: 'Urban Streetwear',
      tagline: 'Contemporary edge, sneaker culture, bold graphics.',
    },
    {
      id: 'Classic Elegance',
      emoji: '✨',
      name: 'Classic Elegance',
      tagline: 'Refined tailoring, timeless silhouettes, subtle glamour.',
    },
    {
      id: 'Active Athleisure',
      emoji: '🏃‍♂️',
      name: 'Active Athleisure',
      tagline: 'Performance gear, breathable cuts, high movement comfort.',
    },
    {
      id: 'Casual Cozy',
      emoji: '☕',
      name: 'Casual Cozy',
      tagline: 'Relaxed knits, everyday cottons, effortless ease.',
    },
  ];

  const PALETTES = [
    {
      id: 'Pastels & Soft Tones',
      name: 'Pastels & Soft Tones',
      colors: ['#c7d2fe', '#fbcfe8', '#bbf7d0', '#fef08a'],
    },
    {
      id: 'Earthy & Warm Browns',
      name: 'Earthy & Warm',
      colors: ['#78350f', '#b45309', '#d97706', '#fef3c7'],
    },
    {
      id: 'Monochrome & Slate',
      name: 'Monochrome Slate',
      colors: ['#0f172a', '#334155', '#94a3b8', '#e2e8f0'],
    },
    {
      id: 'Vibrant & Statement',
      name: 'Vibrant Bold',
      colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'],
    },
  ];

  const CATEGORIES = [
    'Clothing',
    'Footwear',
    'Electronics',
    'Accessories',
    'Beauty',
    'Home',
    'Kitchen',
  ];

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const payload = {
        primaryVibe: selectedVibe,
        favoriteColors: [selectedPalette],
        preferredCategories: selectedCategories.length > 0 ? selectedCategories : ['Clothing', 'Footwear'],
        budgetTier: selectedBudget,
      };

      if (token) {
        const res = await fetch('/api/personal/style-quiz', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          updateUser({ styleQuiz: data.styleQuiz, rewardCoins: data.rewardCoins });
          refreshUser();
        }
      }
      if (onCompleted) onCompleted(payload);
      onClose();
    } catch {
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="style-quiz-overlay" onClick={onClose}>
      <div className="style-quiz-modal" onClick={(e) => e.stopPropagation()}>
        <div className="style-quiz-topbar">
          <div className="quiz-badge-wrap">
            <span className="quiz-badge">Style Quiz</span>
            <span className="quiz-reward-pill">🪙 +50 Coins Reward</span>
          </div>
          <button type="button" className="quiz-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="quiz-progress-track">
          <div
            className="quiz-progress-fill"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        <div className="style-quiz-content">
          {/* STEP 1: Vibe */}
          {step === 1 && (
            <div>
              <h2 className="quiz-step-title">What's your primary fashion aesthetic?</h2>
              <p className="quiz-step-desc">
                We'll tailor your homepage banners, collections, and recommendations to match your vibe.
              </p>
              <div className="vibe-cards-grid">
                {VIBES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`vibe-card-btn ${selectedVibe === v.id ? 'selected' : ''}`}
                    onClick={() => setSelectedVibe(v.id)}
                  >
                    <div className="vibe-emoji">{v.emoji}</div>
                    <div className="vibe-info">
                      <div className="vibe-name">{v.name}</div>
                      <div className="vibe-tagline">{v.tagline}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Color Palette */}
          {step === 2 && (
            <div>
              <h2 className="quiz-step-title">Choose your favorite color palette</h2>
              <p className="quiz-step-desc">
                We will highlight products matching these tones in your feed.
              </p>
              <div className="palette-grid">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`palette-card-btn ${selectedPalette === p.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPalette(p.id)}
                  >
                    <div className="palette-swatches">
                      {p.colors.map((c, i) => (
                        <div key={i} className="swatch-circle" style={{ background: c }}></div>
                      ))}
                    </div>
                    <span className="palette-label">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Categories */}
          {step === 3 && (
            <div>
              <h2 className="quiz-step-title">Which categories do you shop most?</h2>
              <p className="quiz-step-desc">
                Select one or more to personalize your daily homepage tabs.
              </p>
              <div className="categories-select-grid">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`cat-pill-toggle ${active ? 'selected' : ''}`}
                      onClick={() => toggleCategory(cat)}
                    >
                      {active ? '✓ ' : '+ '}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Budget Stance */}
          {step === 4 && (
            <div>
              <h2 className="quiz-step-title">What is your typical shopping stance?</h2>
              <p className="quiz-step-desc">
                Helps our smart optimizer prioritize price ranges and bundle savings.
              </p>
              <div className="vibe-cards-grid">
                {[
                  { id: 'Budget-Friendly', emoji: '🏷️', name: 'Smart Value Hunter', tagline: 'Prioritize best discounts, smart deals, and savings.' },
                  { id: 'Balanced', emoji: '⚖️', name: 'Balanced Shopper', tagline: 'Great mix of trending picks, quality, and fair prices.' },
                  { id: 'Premium', emoji: '💎', name: 'Premium & Luxe', tagline: 'Exclusive releases, top-tier materials, curated aesthetics.' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`vibe-card-btn ${selectedBudget === b.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBudget(b.id)}
                  >
                    <div className="vibe-emoji">{b.emoji}</div>
                    <div className="vibe-info">
                      <div className="vibe-name">{b.name}</div>
                      <div className="vibe-tagline">{b.tagline}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="style-quiz-footer">
          {step > 1 ? (
            <button
              type="button"
              className="quiz-back-btn"
              onClick={() => setStep(step - 1)}
            >
              ← Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button
              type="button"
              className="quiz-next-btn"
              onClick={() => setStep(step + 1)}
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              className="quiz-next-btn"
              onClick={handleFinish}
              disabled={submitting}
            >
              {submitting ? 'Personalizing Feed...' : 'Personalize My Experience ✨'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

