import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setOrders(data.orderHistory || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="orders-page">
      <h2 style={{ marginBottom: '1.5rem', color: '#1a1a2e' }}>📦 My Orders</h2>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📦</div>
          <h3>No orders yet</h3>
          <p>Place your first order!</p>
        </div>
      ) : (
        [...orders].reverse().map((order, idx) => (
          <div className="order-card" key={idx}>
            <h4>
              Order #{orders.length - idx} &nbsp;
              <span style={{ color: '#888', fontSize: '0.8rem', fontWeight: 400 }}>
                {new Date(order.orderedAt).toLocaleString('en-IN', {
                  dateStyle: 'medium', timeStyle: 'short'
                })}
              </span>
            </h4>
            {order.items.map((item, i) => (
              <div className="order-item-row" key={i}>
                <span>{item.productName}</span>
                <span>
                  ₹{item.price.toLocaleString()} × {item.quantity} = ₹{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
            <div className="order-total">Total: ₹{order.totalAmount.toLocaleString()}</div>
          </div>
        ))
      )}
    </div>
  );
}

