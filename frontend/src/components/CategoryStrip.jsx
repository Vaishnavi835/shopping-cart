import { Link, useSearchParams } from 'react-router-dom';

const categories = [
  { name: 'All Products', icon: '🛍️', bg: '#f1f5f9', color: '#1e293b', border: '#cbd5e1' },
  { name: 'Electronics', icon: '💻', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  { name: 'Clothing', icon: '👗', bg: '#f3e8ff', color: '#9333ea', border: '#d8b4fe' },
  { name: 'Footwear', icon: '👟', bg: '#ffedd5', color: '#ea580c', border: '#fdba74' },
  { name: 'Accessories', icon: '👜', bg: '#fef3c7', color: '#d97706', border: '#fcd34d' },
  { name: 'Kitchen', icon: '🍳', bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  { name: 'Sports', icon: '⚽', bg: '#e0f2fe', color: '#0284c7', border: '#7dd3fc' },
  { name: 'Books', icon: '📚', bg: '#fce7f3', color: '#db2777', border: '#f9a8d4' },
];

export default function CategoryStrip() {
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || '';

  return (
    <section className="shop-category-strip">
      <div className="shop-section-header">
        <div>
          <h2 className="shop-section-title">Product Categories</h2>
          <p className="shop-section-sub">Browse handpicked collections tailored for you</p>
        </div>
        <Link to="/products" className="shop-section-link">
          Show All →
        </Link>
      </div>

      <div className="category-pills-scroll">
        {categories.map((cat) => {
          const isAll = cat.name === 'All Products';
          const isActive = isAll ? !currentCategory : currentCategory.toLowerCase() === cat.name.toLowerCase();
          const targetUrl = isAll ? '/products' : `/products?category=${encodeURIComponent(cat.name)}`;

          return (
            <Link
              key={cat.name}
              to={targetUrl}
              className={`category-pill-card ${isActive ? 'pill-active' : ''}`}
              style={{
                backgroundColor: isActive ? cat.color : cat.bg,
                color: isActive ? '#ffffff' : cat.color,
                borderColor: cat.border,
              }}
            >
              <span className="pill-icon">{cat.icon}</span>
              <span className="pill-title">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
