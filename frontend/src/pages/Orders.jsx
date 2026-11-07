import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const { token, authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/orders')
      .then((r) => r.json())
      .then((data) => setOrders(data.orderHistory || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <span style={{ fontWeight: 600, color: '#64748b' }}>Loading your orders...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #d2eade 0%, #e8f5ee 50%, #dff0e6 100%)',
        borderRadius: '24px',
        padding: '2.25rem 3rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(46, 125, 50, 0.08)'
      }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1b382b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
          Home • Account • Orders
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 850, color: '#1b382b', margin: 0 }}>
          📦 My Order History
        </h1>
        <p style={{ color: '#2d5a45', fontWeight: 600, fontSize: '0.95rem', marginTop: '6px' }}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed with express fulfillment tracking
        </p>
      </div>

      {orders.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1.5px solid #f1ece4',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📦</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            No orders placed yet
          </h2>
          <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
            Browse our catalogue of trending products and find something you love today!
          </p>
          <Link
            to="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0f172a',
              color: '#ffffff',
              padding: '0.85rem 2rem',
              borderRadius: '50px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(15,23,42,0.18)'
            }}
          >
            Explore Catalogue →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((order, idx) => {
            const orderNum = order.orderId || `ORD-${String(orders.length - idx).padStart(4, '0')}`;
            const address = order.deliveryAddress;
            const dateStr = new Date(order.orderedAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <div
                key={order._id || idx}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #f1ece4',
                  borderRadius: '22px',
                  padding: '1.75rem 2rem',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.035)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #f1ece4', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 850, color: '#0f172a' }}>
                        {orderNum}
                      </span>
                      <span style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '50px'
                      }}>
                        ✓ {order.paymentStatus || 'Paid & Confirmed'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
                      Placed on {dateStr} • {order.paymentMethod ? `via ${order.paymentMethod}` : 'Online Payment'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                      Total Amount
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                      ₹{order.totalAmount?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Delivery Address if present */}
                {address && (address.street || address.city) && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    color: '#475569',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📍</span>
                    <span>
                      <strong>Delivering to:</strong> {address.fullName || ''} — {address.street}, {address.city} {address.state} {address.postalCode} {address.phone ? `(📞 ${address.phone})` : ''}
                    </span>
                  </div>
                )}

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: i < order.items.length - 1 ? '1px solid #f8fafc' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', background: '#f1f5f9' }}
                          />
                        ) : (
                          <span style={{ fontSize: '1.4rem' }}>📦</span>
                        )}
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 750, color: '#0f172a' }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Quantity: {item.quantity} × ₹{item.price?.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
