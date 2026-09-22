import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CreditCard, Smartphone, Landmark, Wallet, ShieldCheck, Lock, Check } from 'lucide-react';
import { placeOrder, getCart } from '../api';
import { formatCurrency } from '../utils/format';
import './Payment.css';

const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'axis', name: 'Axis Bank' },
];

const ALL_BANKS = [
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Yes Bank',
  'IndusInd Bank',
];

const WALLET_OPTIONS = [
  { id: 'phonepe', name: 'PhonePe', icon: '📱' },
  { id: 'paytm', name: 'Paytm', icon: '💳' },
  { id: 'amazonpay', name: 'Amazon Pay', icon: '📦' },
  { id: 'gpay', name: 'Google Pay', icon: '⚡' },
  { id: 'mobikwik', name: 'MobiKwik', icon: '👛' },
];

export default function Payment({ onCartChange }) {
  const location = useLocation();
  const navigate = useNavigate();

  const deliveryDetails = location.state?.deliveryDetails;
  const initialCart = location.state?.cart;

  const [cart, setCart] = useState(initialCart || { items: [], total: 0 });
  const [loadingCart, setLoadingCart] = useState(!initialCart);
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'upi' | 'netbanking' | 'wallet'

  // Mock form states
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: deliveryDetails?.customer_name || '',
  });

  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('phonepe');

  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [error, setError] = useState(null);

  // If user reaches /payment without submitting delivery details, redirect to /checkout
  useEffect(() => {
    if (!deliveryDetails) {
      navigate('/checkout', { replace: true });
    }
  }, [deliveryDetails, navigate]);

  useEffect(() => {
    if (!initialCart) {
      getCart()
        .then(setCart)
        .catch(() => {})
        .finally(() => setLoadingCart(false));
    }
  }, [initialCart]);

  if (!deliveryDetails) {
    return null;
  }

  if (loadingCart) {
    return <p className="payment-status container">Loading order details…</p>;
  }

  async function handlePay(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Placing real order in DB with delivery details; payment details are mock UI only
      const result = await placeOrder(deliveryDetails);
      setOrderPlaced(result);
      onCartChange?.();
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Format card number with spaces every 4 digits
  function handleCardNumberChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardForm((prev) => ({ ...prev, number: formatted }));
  }

  // Format MM/YY
  function handleExpiryChange(e) {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = val.slice(0, 2) + ' / ' + val.slice(2);
    }
    setCardForm((prev) => ({ ...prev, expiry: val }));
  }

  // CVV up to 4 digits
  function handleCvvChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardForm((prev) => ({ ...prev, cvv: val }));
  }

  // Order Confirmed view (matching existing AURA confirmation screen)
  if (orderPlaced) {
    return (
      <div className="checkout-page container checkout-success">
        <p className="eyebrow">Order Confirmed</p>
        <h1>Thank you, {deliveryDetails.customer_name.split(' ')[0]}.</h1>
        <p className="checkout-success-text">
          Your order <strong>#{orderPlaced.order_id}</strong> has been placed for{' '}
          <strong>{formatCurrency(orderPlaced.total)}</strong>. We'll reach out on{' '}
          <strong>{deliveryDetails.phone}</strong> with delivery updates.
        </p>
        <Link to="/shop" className="btn btn-gold">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="payment-page container">
      <div className="payment-header">
        <p className="eyebrow">Secure Checkout</p>
        <h1 className="payment-title">Payment Options</h1>
        <div className="payment-trust-tag">
          <ShieldCheck size={16} className="text-gold" />
          <span>256-bit SSL Encrypted Demo Gateway</span>
        </div>
      </div>

      <div className="payment-grid">
        {/* LEFT COLUMN: Payment Methods & Mock Inputs */}
        <div className="payment-main">
          {/* Payment Method Selector Tabs */}
          <div className="payment-tabs-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'card'}
              className={`payment-tab-btn ${activeTab === 'card' ? 'active' : ''}`}
              onClick={() => setActiveTab('card')}
            >
              <CreditCard size={18} />
              <span>Card</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'upi'}
              className={`payment-tab-btn ${activeTab === 'upi' ? 'active' : ''}`}
              onClick={() => setActiveTab('upi')}
            >
              <Smartphone size={18} />
              <span>UPI</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'netbanking'}
              className={`payment-tab-btn ${activeTab === 'netbanking' ? 'active' : ''}`}
              onClick={() => setActiveTab('netbanking')}
            >
              <Landmark size={18} />
              <span>Net Banking</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'wallet'}
              className={`payment-tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
              onClick={() => setActiveTab('wallet')}
            >
              <Wallet size={18} />
              <span>Wallets</span>
            </button>
          </div>

          {/* Payment Method Form Content */}
          <form className="payment-card-panel" onSubmit={handlePay}>
            {/* 1. CREDIT / DEBIT CARD */}
            {activeTab === 'card' && (
              <div className="payment-method-fields">
                <div className="payment-panel-head">
                  <h3>Credit / Debit Card</h3>
                  <span className="payment-badge-sub">Visa, Mastercard, RuPay</span>
                </div>

                <label>
                  Card Number
                  <div className="payment-input-with-icon">
                    <CreditCard size={18} className="payment-field-icon" />
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8901"
                      value={cardForm.number}
                      onChange={handleCardNumberChange}
                      autoComplete="cc-number"
                    />
                  </div>
                </label>

                <div className="payment-form-row">
                  <label>
                    Valid Thru
                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={cardForm.expiry}
                      onChange={handleExpiryChange}
                      autoComplete="cc-exp"
                    />
                  </label>

                  <label>
                    CVV / CVC
                    <div className="payment-input-with-icon">
                      <Lock size={16} className="payment-field-icon" />
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cardForm.cvv}
                        onChange={handleCvvChange}
                        autoComplete="cc-csc"
                      />
                    </div>
                  </label>
                </div>

                <label>
                  Name on Card
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={cardForm.name}
                    onChange={(e) => setCardForm((prev) => ({ ...prev, name: e.target.value }))}
                    autoComplete="cc-name"
                  />
                </label>
              </div>
            )}

            {/* 2. UPI */}
            {activeTab === 'upi' && (
              <div className="payment-method-fields">
                <div className="payment-panel-head">
                  <h3>Instant UPI Transfer</h3>
                  <span className="payment-badge-sub">Google Pay, PhonePe, Paytm, BHIM</span>
                </div>

                <label>
                  Enter UPI ID / VPA
                  <div className="payment-input-with-icon">
                    <Smartphone size={18} className="payment-field-icon" />
                    <input
                      type="text"
                      placeholder="yourname@upi or mobile@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                </label>

                <div className="upi-quick-pills">
                  <span className="upi-quick-label">Suggested handles:</span>
                  {['@okhdfcbank', '@okaxis', '@paytm', '@ybl'].map((suf) => (
                    <button
                      key={suf}
                      type="button"
                      className="upi-pill"
                      onClick={() => {
                        const base = upiId.includes('@') ? upiId.split('@')[0] : upiId || 'customer';
                        setUpiId(base + suf);
                      }}
                    >
                      {suf}
                    </button>
                  ))}
                </div>

                <div className="payment-info-box">
                  <p>A collect request will be sent to your UPI app for instantaneous authorization.</p>
                </div>
              </div>
            )}

            {/* 3. NET BANKING */}
            {activeTab === 'netbanking' && (
              <div className="payment-method-fields">
                <div className="payment-panel-head">
                  <h3>Net Banking</h3>
                  <span className="payment-badge-sub">All major Indian banks supported</span>
                </div>

                <div className="popular-banks-grid">
                  {POPULAR_BANKS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`bank-card-btn ${selectedBank === b.name ? 'selected' : ''}`}
                      onClick={() => setSelectedBank(b.name)}
                    >
                      <Landmark size={20} className="bank-icon" />
                      <span>{b.name}</span>
                    </button>
                  ))}
                </div>

                <label>
                  Or Select Another Bank
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="payment-select"
                  >
                    {ALL_BANKS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {/* 4. WALLETS */}
            {activeTab === 'wallet' && (
              <div className="payment-method-fields">
                <div className="payment-panel-head">
                  <h3>Digital Wallets</h3>
                  <span className="payment-badge-sub">Fast 1-click checkout</span>
                </div>

                <div className="wallets-grid">
                  {WALLET_OPTIONS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      className={`wallet-btn ${selectedWallet === w.id ? 'selected' : ''}`}
                      onClick={() => setSelectedWallet(w.id)}
                    >
                      <span className="wallet-emoji">{w.icon}</span>
                      <span className="wallet-name">{w.name}</span>
                      {selectedWallet === w.id && <Check size={16} className="wallet-check" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="payment-error">{error}</p>}

            {/* Pay Button */}
            <div className="payment-action-wrap">
              <button
                type="submit"
                className="btn btn-gold payment-pay-btn"
                disabled={submitting}
              >
                <Lock size={16} />
                {submitting ? 'Processing Payment…' : `Pay ${formatCurrency(cart.total)}`}
              </button>
              <p className="payment-demo-note">
                Demo Payment Gateway • No real money will be charged
              </p>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div className="payment-sidebar">
          <div className="checkout-summary">
            <h3>Order Summary</h3>

            <div className="payment-delivery-preview">
              <span className="payment-preview-label">Delivering to</span>
              <p className="payment-preview-name">{deliveryDetails.customer_name}</p>
              <p className="payment-preview-address">
                {deliveryDetails.address}, {deliveryDetails.city} - {deliveryDetails.pincode}
              </p>
              <p className="payment-preview-phone">Phone: {deliveryDetails.phone}</p>
              <Link to="/checkout" className="payment-edit-link">
                Edit Delivery Details
              </Link>
            </div>

            <div className="payment-summary-divider" />

            {cart.items.map((item) => (
              <div key={item.cart_item_id || item.product_id} className="checkout-summary-item">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}

            <div
              className="checkout-summary-item"
              style={{
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <span>Insured Shipping</span>
              <span>Free</span>
            </div>

            <div className="checkout-summary-total">
              <span>Total Amount</span>
              <span>{formatCurrency(cart.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

