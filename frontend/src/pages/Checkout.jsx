import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';
import FreeDeliveryBar from '../components/FreeDeliveryBar';
import './Checkout.css';

export default function Checkout() {
  const { user, token, authFetch, setCartCount } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Address State
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [savedAddress, setSavedAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: user?.username || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [deliverySpeed, setDeliverySpeed] = useState('express'); // 'standard' | 'express'

  // Payment Method State: 'upi' | 'card' | 'netbanking' | 'cod'
  const [paymentMode, setPaymentMode] = useState('upi');

  // UPI sub-state
  const [upiApp, setUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');

  // Card sub-state
  const [cardData, setCardData] = useState({
    number: '',
    name: user?.username || '',
    expiry: '',
    cvv: '',
  });

  // Net banking sub-state
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // COD captcha state
  const [codCaptcha, setCodCaptcha] = useState('');
  const [expectedCaptcha] = useState('4829');

  // Processing & Success State
  const [processingState, setProcessingState] = useState(null); // null | 'connecting' | 'verifying' | 'success'
  const [completedOrder, setCompletedOrder] = useState(null);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // Load cart and profile address
  useEffect(() => {
    const loadCheckoutData = async () => {
      setLoading(true);
      try {
        const [cartRes, userRes] = await Promise.all([
          fetch('/api/cart', { headers: authHeader }),
          authFetch('/api/users/me'),
        ]);

        if (cartRes.ok) {
          const cData = await cartRes.json();
          const valid = (cData.cart || []).filter(
            (i) => i && i.product && typeof i.product === 'object' && i.product._id
          );
          setCart(valid);
          if (valid.length === 0) {
            navigate('/cart');
            return;
          }
        }

        if (userRes.ok) {
          const uData = await userRes.json();
          const u = uData.user;
          if (u.address && (u.address.street || u.address.city)) {
            setSavedAddress({
              fullName: u.username,
              phone: u.phone || '',
              street: u.address.street || '',
              city: u.address.city || '',
              state: u.address.state || '',
              postalCode: u.address.postalCode || '',
              country: u.address.country || 'India',
            });
            setAddressForm({
              fullName: u.username,
              phone: u.phone || '',
              street: u.address.street || '',
              city: u.address.city || '',
              state: u.address.state || '',
              postalCode: u.address.postalCode || '',
              country: u.address.country || 'India',
            });
          } else {
            setUseSavedAddress(false);
            setAddressForm((prev) => ({
              ...prev,
              fullName: u.username,
              phone: u.phone || '',
            }));
          }
        }
      } catch {
        showToast('Error loading checkout details');
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [token]);

  // Price calculations
  const mrpTotal = cart.reduce((sum, item) => sum + (item.product.productPrice || 0) * item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => {
    const p = item.product;
    const price = p.discount > 0 ? p.productPrice * (1 - p.discount / 100) : p.productPrice || 0;
    return sum + price * item.quantity;
  }, 0);
  const discountSavings = Math.max(0, mrpTotal - subtotal);
  const deliveryCharge = 0; // FREE
  const finalPayable = subtotal + deliveryCharge;

  // Format Card Number input with spaces (e.g. 4532 8291 0293 8472)
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = val.replace(/(.{4})/g, '$1 ').trim();
    setCardData({ ...cardData, number: formatted });
  };

  // Format Expiry MM/YY
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setCardData({ ...cardData, expiry: val });
  };

  // Submit and Pay
  const handlePayAndOrder = async (e) => {
    e.preventDefault();

    // Validate delivery details
    const activeAddress = useSavedAddress && savedAddress ? savedAddress : addressForm;
    if (!activeAddress.street || !activeAddress.city || !activeAddress.postalCode) {
      showToast('❌ Please fill in complete delivery address details.');
      return;
    }

    // Validate payment mode specifics
    if (paymentMode === 'card') {
      const cleanNum = cardData.number.replace(/\s/g, '');
      if (cleanNum.length < 16) {
        showToast('❌ Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardData.expiry || cardData.expiry.length < 5) {
        showToast('❌ Please enter card expiry MM/YY.');
        return;
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        showToast('❌ Please enter 3-digit CVV.');
        return;
      }
    }

    if (paymentMode === 'cod' && codCaptcha !== expectedCaptcha) {
      showToast('❌ Please enter the 4-digit verification code correctly.');
      return;
    }

    // Start payment processing steps
    setProcessingState('connecting');

    setTimeout(() => {
      setProcessingState('verifying');
    }, 1200);

    setTimeout(async () => {
      try {
        const paymentMethodNames = {
          upi: `UPI (${upiApp.toUpperCase()})`,
          card: 'Credit/Debit Card',
          netbanking: `Net Banking (${selectedBank})`,
          cod: 'Cash on Delivery (COD)',
        };

        const res = await authFetch('/api/cart/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliveryAddress: activeAddress,
            paymentMethod: paymentMethodNames[paymentMode] || 'Card',
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setCartCount(0);
          setCompletedOrder(data.order || { orderId: data.orderId, totalAmount: finalPayable });
          setProcessingState('success');
        } else {
          setProcessingState(null);
          showToast('❌ ' + (data.message || 'Payment failed'));
        }
      } catch {
        setProcessingState(null);
        showToast('❌ Network error during payment processing');
      }
    }, 2400);
  };

  if (loading) {
    return (
      <div className="checkout-page-wrapper">
        <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <span style={{ fontWeight: 600, color: '#64748b' }}>Preparing secure checkout...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-wrapper">
      {/* ─── 1. TOP HEADER & CHECKOUT PROGRESS STEPPER ─── */}
      <section className="checkout-banner-card">
        <div className="checkout-banner-left">
          <div className="checkout-breadcrumb-chip">
            Home • Cart • Secure Checkout
          </div>
          <h1 className="checkout-banner-title">
            Delivery &amp; Payment
          </h1>

          <div className="checkout-steps-bar">
            <Link to="/cart" className="checkout-step-pill completed">
              <span>✓</span> 1. Bag Review
            </Link>
            <span className="checkout-step-arrow">➔</span>
            <div className="checkout-step-pill active">
              <span>🚚</span> 2. Delivery Address
            </div>
            <span className="checkout-step-arrow">➔</span>
            <div className="checkout-step-pill active">
              <span>💳</span> 3. Payment Mode
            </div>
          </div>
        </div>

        <div className="checkout-ssl-badge">
          <span>🔒 256-Bit SSL Encrypted Payment</span>
        </div>
      </section>

      {/* ─── 2. MAIN 2-COLUMN CHECKOUT LAYOUT ─── */}
      <div className="checkout-main-grid">
        {/* Left Column: Delivery Form + Payment Gateway */}
        <div className="checkout-forms-column">
          {/* STEP 2: DELIVERY ADDRESS */}
          <section className="checkout-section-card">
            <div className="section-card-header">
              <h3>
                <span className="section-step-num">2</span>
                <span>Delivery Address</span>
              </h3>
              {savedAddress && (
                <button
                  type="button"
                  className="address-toggle-btn"
                  onClick={() => setUseSavedAddress(!useSavedAddress)}
                >
                  {useSavedAddress ? '+ Deliver to a New Address' : '✓ Use Saved Address'}
                </button>
              )}
            </div>

            {useSavedAddress && savedAddress ? (
              <div className="saved-address-chip-card selected">
                <div className="address-chip-info">
                  <div className="address-chip-name">{savedAddress.fullName || user?.username}</div>
                  <div>{savedAddress.street}</div>
                  <div>{savedAddress.city}, {savedAddress.state} - {savedAddress.postalCode}</div>
                  {savedAddress.phone && (
                    <div className="address-chip-phone">📞 Phone: {savedAddress.phone}</div>
                  )}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669', background: '#dcfce7', padding: '4px 10px', borderRadius: '50px' }}>
                  ✓ Selected
                </span>
              </div>
            ) : (
              <div className="checkout-form-grid">
                <div className="checkout-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    placeholder="Recipient's name"
                  />
                </div>

                <div className="checkout-field">
                  <label>Contact Phone (+91)</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="checkout-field full-col">
                  <label>Flat / House No., Apartment &amp; Street</label>
                  <input
                    type="text"
                    required
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="e.g. Flat 402, Green Meadows, MG Road"
                  />
                </div>

                <div className="checkout-field">
                  <label>City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="City / District"
                  />
                </div>

                <div className="checkout-field">
                  <label>State</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="State"
                  />
                </div>

                <div className="checkout-field">
                  <label>PIN / Postal Code</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    placeholder="6-digit PIN code"
                  />
                </div>

                <div className="checkout-field">
                  <label>Country</label>
                  <input type="text" disabled value="India" />
                </div>
              </div>
            )}

            {/* Delivery Speed Options */}
            <div className="delivery-speed-row">
              <div
                className={`delivery-speed-card ${deliverySpeed === 'express' ? 'selected' : ''}`}
                onClick={() => setDeliverySpeed('express')}
              >
                <div className="speed-radio-dot">
                  {deliverySpeed === 'express' && <div className="speed-radio-inner" />}
                </div>
                <div>
                  <div className="speed-title">⚡ Express Delivery (FREE)</div>
                  <div className="speed-sub">Guaranteed delivery by Tomorrow</div>
                </div>
              </div>

              <div
                className={`delivery-speed-card ${deliverySpeed === 'standard' ? 'selected' : ''}`}
                onClick={() => setDeliverySpeed('standard')}
              >
                <div className="speed-radio-dot">
                  {deliverySpeed === 'standard' && <div className="speed-radio-inner" />}
                </div>
                <div>
                  <div className="speed-title">🚚 Standard Delivery (FREE)</div>
                  <div className="speed-sub">Delivery in 2 - 3 Business Days</div>
                </div>
              </div>
            </div>
          </section>

          {/* STEP 3: PAYMENT MODE */}
          <section className="checkout-section-card">
            <div className="section-card-header">
              <h3>
                <span className="section-step-num">3</span>
                <span>Select Payment Mode</span>
              </h3>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
                ✓ 100% Buyer Protection
              </span>
            </div>

            {/* Payment Mode Navigation Tabs */}
            <div className="payment-tabs-bar">
              <button
                type="button"
                className={`payment-tab-btn ${paymentMode === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMode('upi')}
              >
                <span className="tab-icon">⚡</span>
                <span>Instant UPI</span>
              </button>

              <button
                type="button"
                className={`payment-tab-btn ${paymentMode === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMode('card')}
              >
                <span className="tab-icon">💳</span>
                <span>Debit / Credit</span>
              </button>

              <button
                type="button"
                className={`payment-tab-btn ${paymentMode === 'netbanking' ? 'active' : ''}`}
                onClick={() => setPaymentMode('netbanking')}
              >
                <span className="tab-icon">🏦</span>
                <span>Net Banking</span>
              </button>

              <button
                type="button"
                className={`payment-tab-btn ${paymentMode === 'cod' ? 'active' : ''}`}
                onClick={() => setPaymentMode('cod')}
              >
                <span className="tab-icon">💵</span>
                <span>Pay on Delivery</span>
              </button>
            </div>

            {/* 3A. UPI PANEL */}
            {paymentMode === 'upi' && (
              <div className="upi-panel-box">
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '10px' }}>
                  CHOOSE UPI APP:
                </div>
                <div className="upi-apps-row">
                  {[
                    { id: 'gpay', name: 'Google Pay', icon: '🟢' },
                    { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
                    { id: 'paytm', name: 'Paytm', icon: '🔵' },
                    { id: 'bhim', name: 'BHIM UPI', icon: '🟠' },
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      className={`upi-app-btn ${upiApp === app.id ? 'selected' : ''}`}
                      onClick={() => setUpiApp(app.id)}
                    >
                      <span>{app.icon}</span>
                      <span>{app.name}</span>
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
                  OR ENTER UPI ID / VPA:
                </div>
                <div className="upi-id-input-group">
                  <input
                    type="text"
                    className="upi-id-input"
                    placeholder="e.g. mobile@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                  <button type="button" className="upi-verify-btn">
                    Verify
                  </button>
                </div>
              </div>
            )}

            {/* 3B. CARD PANEL WITH LIVE CARD VISUALIZER */}
            {paymentMode === 'card' && (
              <div>
                {/* Live Card Graphic */}
                <div className="card-live-preview">
                  <div className="card-preview-top">
                    <span className="card-chip-icon">💳</span>
                    <span className="card-network-logo">VISA / RuPay</span>
                  </div>
                  <div className="card-preview-number">
                    {cardData.number || '•••• •••• •••• ••••'}
                  </div>
                  <div className="card-preview-bottom">
                    <div className="card-holder-col">
                      <label>CARDHOLDER</label>
                      <div className="card-holder-val">{cardData.name || 'NAME SURNAME'}</div>
                    </div>
                    <div className="card-expiry-col">
                      <label>EXPIRES</label>
                      <div className="card-expiry-val">{cardData.expiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>

                {/* Card Inputs Form */}
                <div className="checkout-form-grid">
                  <div className="checkout-field full-col">
                    <label>Card Number</label>
                    <input
                      type="text"
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={cardData.number}
                      onChange={handleCardNumberChange}
                    />
                  </div>

                  <div className="checkout-field full-col">
                    <label>Name on Card</label>
                    <input
                      type="text"
                      placeholder="e.g. VAISHNAVI T"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                    />
                  </div>

                  <div className="checkout-field">
                    <label>Valid Thru</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardData.expiry}
                      onChange={handleExpiryChange}
                    />
                  </div>

                  <div className="checkout-field">
                    <label>CVV / CVC</label>
                    <input
                      type="password"
                      maxLength="3"
                      placeholder="3 digits"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3C. NET BANKING PANEL */}
            {paymentMode === 'netbanking' && (
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '10px' }}>
                  POPULAR BANKS:
                </div>
                <div className="netbanking-banks-grid">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank'].map((b) => (
                    <div
                      key={b}
                      className={`bank-choice-card ${selectedBank === b ? 'selected' : ''}`}
                      onClick={() => setSelectedBank(b)}
                    >
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3D. CASH ON DELIVERY PANEL */}
            {paymentMode === 'cod' && (
              <div className="cod-panel-box">
                <div className="cod-note">
                  💵 <strong>Cash on Delivery (Pay at Doorstep):</strong> Pay in cash or scan the delivery partner's UPI QR code when your shipment arrives.
                </div>
                <div className="checkout-field" style={{ maxWidth: '280px' }}>
                  <label>Confirm Code: Type "{expectedCaptcha}"</label>
                  <input
                    type="text"
                    maxLength="4"
                    placeholder="Enter 4-digit code"
                    value={codCaptcha}
                    onChange={(e) => setCodCaptcha(e.target.value.trim())}
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Sticky Order Summary & Pay Action */}
        <aside className="checkout-summary-column">
          <div className="checkout-summary-card">
            {/* Free Delivery Progress Indicator */}
            <FreeDeliveryBar currentAmount={subtotal} threshold={1000} />

            <div className="checkout-summary-header">
              <h3>Order Summary</h3>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>
                {cart.reduce((s, i) => s + i.quantity, 0)} Items
              </span>
            </div>

            {/* Items miniature list */}
            <div className="checkout-items-preview-list">
              {cart.map((item) => (
                <div key={item._id} className="checkout-item-mini-row">
                  <img
                    src={item.product?.imageUrl || '/logo.png'}
                    alt={item.product?.productName}
                    className="checkout-item-mini-img"
                  />
                  <div className="checkout-item-mini-info">
                    <div className="checkout-item-mini-name">{item.product?.productName}</div>
                    <div className="checkout-item-mini-qty">Qty: {item.quantity}</div>
                  </div>
                  <div className="checkout-item-mini-price">
                    ₹{((item.product?.productPrice * (1 - (item.product?.discount || 0) / 100)) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing details */}
            <div className="checkout-price-list">
              <div className="checkout-price-row">
                <span>Total MRP</span>
                <span>₹{mrpTotal.toLocaleString()}</span>
              </div>
              {discountSavings > 0 && (
                <div className="checkout-price-row discount">
                  <span>Discount Savings</span>
                  <span>−₹{discountSavings.toLocaleString()}</span>
                </div>
              )}
              <div className="checkout-price-row">
                <span>Delivery Speed</span>
                <span style={{ color: '#059669', fontWeight: 800 }}>FREE</span>
              </div>
              <div className="checkout-price-row">
                <span>Taxes &amp; Fees</span>
                <span>Included</span>
              </div>
            </div>

            <div className="checkout-divider" />

            <div className="checkout-total-row">
              <span className="checkout-total-label">Total Payable</span>
              <span className="checkout-total-val">₹{finalPayable.toLocaleString()}</span>
            </div>

            {/* Pay Button */}
            <button
              type="button"
              className="checkout-pay-btn"
              onClick={handlePayAndOrder}
              disabled={Boolean(processingState)}
            >
              <span>Pay ₹{finalPayable.toLocaleString()} &amp; Place Order</span>
              <span>→</span>
            </button>

            {/* Guarantees */}
            <div className="checkout-guarantee-list">
              <div className="checkout-guarantee-item">
                <span>🔒</span> 256-Bit SSL Encrypted Checkout
              </div>
              <div className="checkout-guarantee-item">
                <span>⚡</span> Instant Order Confirmation &amp; Live Tracking
              </div>
              <div className="checkout-guarantee-item">
                <span>🛡️</span> 100% Genuine Products &amp; 30-Day Returns
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── 3. PAYMENT PROCESSING MODAL / SUCCESS OVERLAY ─── */}
      {processingState && (
        <div className="payment-processing-overlay">
          <div className="payment-modal-card">
            {processingState === 'connecting' && (
              <>
                <div className="processing-spinner-box" />
                <h2>Connecting to Gateway...</h2>
                <p>Establishing an encrypted, bank-grade connection for your payment.</p>
              </>
            )}

            {processingState === 'verifying' && (
              <>
                <div className="processing-spinner-box" />
                <h2>Authorizing Payment...</h2>
                <p>Verifying transaction with your selected payment provider.</p>
              </>
            )}

            {processingState === 'success' && (
              <>
                <div className="payment-success-badge">
                  ✓
                </div>
                <h2>Payment Successful! 🎉</h2>
                <p>Your order has been verified and sent for express fulfillment.</p>

                <div className="payment-receipt-box">
                  <div className="receipt-row">
                    <span>Order Number:</span>
                    <span style={{ color: '#059669', fontWeight: 800 }}>{completedOrder?.orderId}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Amount Paid:</span>
                    <span>₹{completedOrder?.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Payment Mode:</span>
                    <span>{paymentMode.toUpperCase()}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Estimated Delivery:</span>
                    <span>Tomorrow, Express Delivery ⚡</span>
                  </div>
                </div>

                <div className="payment-modal-actions">
                  <Link to="/orders" className="receipt-btn-primary">
                    📦 View in My Orders
                  </Link>
                  <Link to="/products" className="receipt-btn-secondary">
                    🛍️ Continue Shopping
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}

