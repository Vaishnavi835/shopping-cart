import React from 'react';
import './CategoryStrip.css';
import { Link } from 'react-router-dom';

const categories = [
  { name: 'Electronics', img: '/design/category1.jpg', id: 'electronics' },
  { name: 'Clothing', img: '/design/category2.jpg', id: 'clothing' },
  { name: 'Accessories', img: '/design/category3.jpg', id: 'accessories' },
];

export default function CategoryStrip() {
  return (
    <section className="shop-category-strip">
      <div className="shop-category-grid">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/products?category=${encodeURIComponent(cat.name)}`}
            className="shop-category-card"
          >
            <img src={cat.img} alt={cat.name} className="shop-category-img" />
            <div className="shop-category-label">{cat.name}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

