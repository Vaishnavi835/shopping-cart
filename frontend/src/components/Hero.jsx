import React from 'react';
import './Hero.css';

export default function Hero() {
  return (
    <section className="shop-hero">
      <img src="/design/hero.jpg" alt="Hero" className="shop-hero-bg" />
      <div className="shop-hero-overlay" />
      <div className="shop-hero-content">
        <h1 className="shop-hero-title">Discover the Latest Trends</h1>
        <p className="shop-hero-subtitle">Curated collections for every style.</p>
        <a href="/products" className="shop-hero-btn">Shop Now</a>
      </div>
    </section>
  );
}

