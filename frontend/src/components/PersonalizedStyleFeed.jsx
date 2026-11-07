import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StyleQuizModal from './StyleQuizModal';
import './PersonalizedStyleFeed.css';

export default function PersonalizedStyleFeed({ onOpenQuickView, onAddToCart }) {
  const { user, token, refreshCartCount } = useAuth();
  const [styleData, setStyleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  const fetchStyleFeed = async () => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/personal/style-feed', { headers });
      if (res.ok) {
        const data = await res.json();
        setStyleData(data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStyleFeed();
  }, [user?.styleQuiz?.completed, token]);

  const isQuizDone = user?.styleQuiz?.completed || styleData?.isPersonalized;
  const vibeName = user?.styleQuiz?.primaryVibe || styleData?.primaryVibe || 'Minimalist Modern';

  return (
    <section className="style-feed-wrapper">
      {!isQuizDone ? (
        <div className="style-quiz-invite-banner">
          <div className="invite-content-col">
            <div className="invite-badge-row">
              <span className="invite-spark-tag">✨ Personalize Your Store</span>
              <span className="invite-reward-tag">🪙 Earn +50 Coins</span>
            </div>
            <h2 className="invite-headline">Take the 20-Second Style Quiz</h2>
            <p className="invite-subtext">
              Tell us your favorite fashion vibe, color palette, and preferred categories to personalize your homepage feed from day one.
            </p>
          </div>
          <button
            type="button"
            className="invite-cta-btn"
            onClick={() => setQuizModalOpen(true)}
          >
            Start Style Quiz →
          </button>
        </div>
      ) : (
        <div>
          <div className="curated-header-box">
            <div className="curated-info-group">
              <div className="curated-vibe-emoji">✨</div>
              <div>
                <h2 className="curated-title">Curated for Your Style — {vibeName}</h2>
                <p className="curated-subtitle">
                  Personalized based on your style quiz preferences •{' '}
                  {(user?.styleQuiz?.preferredCategories || ['Clothing', 'Footwear', 'Accessories']).join(', ')}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="retake-quiz-btn"
              onClick={() => setQuizModalOpen(true)}
            >
              ⚙️ Retake Style Quiz
            </button>
          </div>

          {/* Curated Products Grid */}
          <div className="curated-products-grid">
            {(styleData?.products || []).slice(0, 4).map((p) => {
              const discounted = p.discount > 0 ? p.productPrice * (1 - p.discount / 100) : p.productPrice;
              return (
                <div key={p._id} className="popular-clean-card">
                  <div className="popular-img-wrapper">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.productName} className="popular-img" />
                    ) : (
                      <span className="popular-img-fallback">📦</span>
                    )}
                    {p.discount > 0 && (
                      <span className="popular-discount-tag">-{p.discount}%</span>
                    )}
                  </div>

                  <div className="popular-card-body">
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
                      {p.category}
                    </span>
                    <h3 className="popular-product-title" title={p.productName}>
                      {p.productName}
                    </h3>
                    <div className="popular-price-row">
                      <span className="popular-main-price">₹{discounted.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      {p.discount > 0 && (
                        <span className="popular-old-price">₹{p.productPrice.toLocaleString()}</span>
                      )}
                      <Link
                        to="/products"
                        className="popular-quick-add-btn"
                        style={{ textDecoration: 'none' }}
                      >
                        Explore
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Style Quiz Modal */}
      <StyleQuizModal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        onCompleted={() => fetchStyleFeed()}
      />
    </section>
  );
}

