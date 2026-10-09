import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Smartphone,
  CreditCard,
  Landmark,
  Percent,
  Wallet,
  Clock,
  Lock,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { placeOrder, getCart } from '../api';
import { formatCurrency } from '../utils/format';
import './Payment.css';

const POPULAR_BANKS = [
  { id: 'sbi', name: 'SBI', code: 'SBI' },
  { id: 'icici', name: 'ICICI', code: 'ICICI' },
  { id: 'kotak', name: 'Kotak', code: 'KMB' },
  { id: 'axis', name: 'Axis', code: 'AXIS' },
  { id: 'bob', name: 'BOB', code: 'BOB' },
];

const MORE_BANKS = [
  'HDFC Bank',
  'Punjab National Bank',
  'Canara Bank',
  'Union Bank of India',
  'IndusInd Bank',
  'Yes Bank',
  'Federal Bank',
  'IDFC First Bank',
];

const WALLET_PROVIDERS = [
  { id: 'phonepe', name: 'PhonePe', icon: '📱' },
  { id: 'paytm', name: 'Paytm', icon: '💳' },
  { id: 'amazonpay', name: 'Amazon Pay', icon: '📦' },
  { id: 'mobikwik', name: 'MobiKwik', icon: '⚡' },
];

const PAY_LATER_PROVIDERS = [
  { id: 'simpl', name: 'Simpl', badge: '1-tap pay' },
  { id: 'lazypay', name: 'LazyPay', badge: 'Pay next month' },
  { id: 'icici_paylater', name: 'ICICI PayLater', badge: 'Pre-approved' },
];

export default function Payment({ onCartChange }) {
  const location = useLocation();
  const navigate = useNavigate();

  const deliveryDetails = location.state?.deliveryDetails;
  const initialCart = location.state?.cart;

  const [cart, setCart] = useState(initialCart || { items: [], total: 0 });
  const [loadingCart, setLoadingCart] = useState(!initialCart);

  // Razorpay Checkout Steps: 1 = Contact Details, 2 = Payment Options
  const [step, setStep] = useState(1);

  // Phone input state for Step 1
  const [mobileNumber, setMobileNumber] = useState(
    deliveryDetails?.phone ? deliveryDetails.phone.replace(/^\+91/, '').trim() : ''
  );

  // Step 2: Accordion expanded state ('upi' | 'card' | 'netbanking' | 'emi' | 'wallet' | 'paylater' | null)
  const [expandedMethod, setExpandedMethod] = useState('upi');

  // Form states for mock fields
  const [upiId, setUpiId] = useState('');
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: deliveryDetails?.customer_name || '',
  });
  const [selectedBank, setSelectedBank] = useState('SBI');
  const [selectedWallet, setSelectedWallet] = useState('phonepe');
  const [selectedEmi, setSelectedEmi] = useState('3m');
  const [selectedPayLater, setSelectedPayLater] = useState('simpl');

  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [error, setError] = useState(null);
  const [upiError, setUpiError] = useState(null);
  const [cardError, setCardError] = useState(null);

  const UPI_REGEX = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/;

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

  // Handle header back navigation
  function handleBack() {
    if (step === 2) {
      setStep(1);
    } else {
      navigate('/checkout');
    }
  }

  // Handle Step 1 continue
  function handleContactContinue(e) {
    e.preventDefault();
    setStep(2);
  }

  // Handle toggle accordion
  function handleToggleMethod(methodKey) {
    setExpandedMethod((prev) => (prev === methodKey ? null : methodKey));
    setError(null);
    setUpiError(null);
    setCardError(null);
  }

  // Format card number with spaces every 4 digits
  function handleCardNumberChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardForm((prev) => ({ ...prev, number: formatted }));
    if (cardError) setCardError(null);
    if (error) setError(null);
  }

  // Format MM/YY
  function handleExpiryChange(e) {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardForm((prev) => ({ ...prev, expiry: val }));
    if (cardError) setCardError(null);
    if (error) setError(null);
  }

  // CVV up to 4 digits
  function handleCvvChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardForm((prev) => ({ ...prev, cvv: val }));
    if (cardError) setCardError(null);
    if (error) setError(null);
  }

  // Final Pay submission: calls existing POST /api/orders
  async function handleFinalPay(e) {
    if (e) e.preventDefault();
    setError(null);
    setUpiError(null);
    setCardError(null);

    if (!expandedMethod) {
      setError('Please select a payment option to continue.');
      return;
    }

    if (expandedMethod === 'upi') {
      const cleanUpi = upiId.trim();
      if (!cleanUpi) {
        setUpiError('Please enter your UPI ID / VPA to proceed');
        setError('Please enter your UPI ID / VPA before clicking Pay.');
        return;
      }
      if (!UPI_REGEX.test(cleanUpi)) {
        setUpiError('Enter a valid UPI ID in username@bank format');
        setError('Please enter a valid UPI ID (e.g. yourname@okhdfcbank or 9876543210@paytm).');
        return;
      }
    }

    if (expandedMethod === 'card') {
      const rawCardNum = cardForm.number.replace(/\s/g, '');
      if (rawCardNum.length !== 16) {
        setCardError('Enter a valid 16-digit card number');
        setError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry)) {
        setCardError('Enter valid expiry date (MM/YY)');
        setError('Please enter a valid card expiry date (MM/YY).');
        return;
      }
      if (cardForm.cvv.length < 3) {
        setCardError('Enter a valid 3-digit CVV');
        setError('Please enter a valid CVV.');
        return;
      }
      if (!cardForm.name.trim()) {
        setCardError('Enter the cardholder name');
        setError('Please enter the name on your card.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const result = await placeOrder(deliveryDetails);
      setOrderPlaced(result);
      onCartChange?.();
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate mock EMI amounts
  const totalAmount = cart.total || 0;
  const emi3Month = Math.round((totalAmount * 1.02) / 3);
  const emi6Month = Math.round((totalAmount * 1.04) / 6);

  // Order Confirmed view (matching existing AURA confirmation screen)
  if (orderPlaced) {
    return (
      <div className="checkout-page container checkout-success" style={{ minHeight: '60vh', paddingTop: '4rem', paddingBottom: '5rem' }}>
        <p className="eyebrow">Order Confirmed</p>
        <h1>Thank you, {deliveryDetails.customer_name.split(' ')[0]}.</h1>
        <p className="checkout-success-text">
          Your order <strong>#{orderPlaced.order_id}</strong> has been placed for{' '}
          <strong>{formatCurrency(orderPlaced.total)}</strong>. We'll reach out on{' '}
          <strong>{deliveryDetails.phone}</strong> with delivery updates{deliveryDetails?.email ? (
            <> and a confirmation receipt has been sent to <strong>{deliveryDetails.email}</strong></>
          ) : null}.
        </p>
        <Link to="/shop" className="btn btn-gold">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="rzp-backdrop">
      <div className="rzp-modal">
        {/* ================= HEADER BAR (Razorpay Blue) ================= */}
        <div className="rzp-header">
          {/* Top row: Back button, Merchant details, Account icon */}
          <div className="rzp-header-top">
            <button
              type="button"
              className="rzp-back-btn"
              onClick={handleBack}
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="rzp-merchant-info">
              <span className="rzp-merchant-name">AURA</span>
              <div className="rzp-verified-badge">
                <CheckCircle2 size={12} className="rzp-verified-icon" />
                <span>Verified Business</span>
              </div>
            </div>

            <div className="rzp-user-avatar" title={deliveryDetails.customer_name}>
              <User size={18} />
            </div>
          </div>

          {/* Center row: Total Amount */}
          <div className="rzp-amount-wrap">
            <span className="rzp-amount-label">Total Amount</span>
            <div className="rzp-amount-val">
              {loadingCart ? '...' : formatCurrency(cart.total)}
            </div>
          </div>
        </div>

        {/* ================= STEP 1: CONTACT DETAILS ================= */}
        {step === 1 && (
          <div className="rzp-body">
            <div className="rzp-step-heading-group">
              <h2 className="rzp-step-title">Contact details</h2>
              <p className="rzp-step-subtitle">Enter mobile number to continue</p>
            </div>

            <form onSubmit={handleContactContinue} className="rzp-contact-form">
              <div className="rzp-phone-input-wrap">
                <span className="rzp-country-code">+91</span>
                <input
                  type="tel"
                  className="rzp-phone-input"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <div className="rzp-customer-greeting">
                Paying as <strong className="rzp-customer-name">{deliveryDetails.customer_name}</strong>
              </div>

              <button type="submit" className="rzp-dark-btn">
                Continue
              </button>

              <div className="rzp-footer-tag">
                <ShieldCheck size={14} className="rzp-footer-shield" />
                <span>Standard Razorpay Checkout Demo</span>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 2: PAYMENT OPTIONS ================= */}
        {step === 2 && (
          <div className="rzp-body">
            <div className="rzp-step-heading-group">
              <h2 className="rzp-step-title">Payment Options</h2>
              <p className="rzp-step-subtitle">All Payment Options</p>
            </div>

            {error && <div className="rzp-error-banner">{error}</div>}

            <div className="rzp-accordion-list">
              {/* 1. UPI */}
              <div className={`rzp-row-item ${expandedMethod === 'upi' ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="rzp-row-header"
                  onClick={() => handleToggleMethod('upi')}
                >
                  <div className="rzp-row-left">
                    <div className="rzp-row-icon rzp-icon-upi">
                      <Smartphone size={18} />
                    </div>
                    <div className="rzp-row-meta">
                      <span className="rzp-method-title">UPI</span>
                      <span className="rzp-method-subtitle">Google Pay, PhonePe, Paytm, BHIM</span>
                    </div>
                  </div>
                  <div className="rzp-row-right">
                    <div className="rzp-mini-badges">
                      <span className="rzp-chip">GPay</span>
                      <span className="rzp-chip">Paytm</span>
                    </div>
                    {expandedMethod === 'upi' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {expandedMethod === 'upi' && (
                  <div className="rzp-row-content">
                    <label className="rzp-field-label">Enter UPI ID / VPA</label>
                    <div className="rzp-input-box">
                      <input
                        type="text"
                        placeholder="yourname@upi or mobile@bank"
                        value={upiId}
                        onChange={(e) => {
                          setUpiId(e.target.value);
                          if (upiError) setUpiError(null);
                          if (error) setError(null);
                        }}
                        className={`rzp-text-input ${upiError ? 'input-error' : ''}`}
                      />
                    </div>
                    {upiError && <span className="rzp-field-error">{upiError}</span>}
                    <div className="rzp-quick-pills">
                      <span className="rzp-quick-label">Suggested:</span>
                      {['@okhdfcbank', '@okaxis', '@paytm', '@ybl'].map((h) => (
                        <button
                          key={h}
                          type="button"
                          className="rzp-pill-btn"
                          onClick={() => {
                            const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId || 'customer';
                            setUpiId(prefix + h);
                            if (upiError) setUpiError(null);
                            if (error) setError(null);
                          }}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. CARDS */}
              <div className={`rzp-row-item ${expandedMethod === 'card' ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="rzp-row-header"
                  onClick={() => handleToggleMethod('card')}
                >
                  <div className="rzp-row-left">
                    <div className="rzp-row-icon rzp-icon-card">
                      <CreditCard size={18} />
                    </div>
                    <div className="rzp-row-meta">
                      <span className="rzp-method-title">Cards</span>
                      <span className="rzp-method-subtitle">Credit and Debit cards</span>
                    </div>
                  </div>
                  <div className="rzp-row-right">
                    <div className="rzp-card-logos">
                      <span className="rzp-card-logo visa">VISA</span>
                      <span className="rzp-card-logo mc">MC</span>
                      <span className="rzp-card-logo rupay">RuPay</span>
                    </div>
                    {expandedMethod === 'card' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {expandedMethod === 'card' && (
                  <div className="rzp-row-content">
                    {cardError && <div className="rzp-field-error" style={{ marginBottom: '0.65rem' }}>{cardError}</div>}
                    <div className="rzp-input-group">
                      <label className="rzp-field-label">Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 0123 4567 8901"
                        value={cardForm.number}
                        onChange={handleCardNumberChange}
                        className={`rzp-text-input ${cardError && cardForm.number.replace(/\s/g, '').length !== 16 ? 'input-error' : ''}`}
                      />
                    </div>

                    <div className="rzp-input-split">
                      <div className="rzp-input-group">
                        <label className="rzp-field-label">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardForm.expiry}
                          onChange={handleExpiryChange}
                          className={`rzp-text-input ${cardError && !/^\d{2}\/\d{2}$/.test(cardForm.expiry) ? 'input-error' : ''}`}
                        />
                      </div>
                      <div className="rzp-input-group">
                        <label className="rzp-field-label">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          value={cardForm.cvv}
                          onChange={handleCvvChange}
                          className={`rzp-text-input ${cardError && cardForm.cvv.length < 3 ? 'input-error' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="rzp-input-group">
                      <label className="rzp-field-label">Cardholder's Name</label>
                      <input
                        type="text"
                        placeholder="Name as on card"
                        value={cardForm.name}
                        onChange={(e) => {
                          setCardForm((prev) => ({ ...prev, name: e.target.value }));
                          if (cardError) setCardError(null);
                          if (error) setError(null);
                        }}
                        className={`rzp-text-input ${cardError && !cardForm.name.trim() ? 'input-error' : ''}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. NETBANKING */}
              <div className={`rzp-row-item ${expandedMethod === 'netbanking' ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="rzp-row-header"
                  onClick={() => handleToggleMethod('netbanking')}
                >
                  <div className="rzp-row-left">
                    <div className="rzp-row-icon rzp-icon-netbanking">
                      <Landmark size={18} />
                    </div>
                    <div className="rzp-row-meta">
                      <span className="rzp-method-title">Netbanking</span>
                      <span className="rzp-method-subtitle">All Indian banks</span>
                    </div>
                  </div>
                  <div className="rzp-row-right">
                    {expandedMethod === 'netbanking' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {expandedMethod === 'netbanking' && (
                  <div className="rzp-row-content">
                    <span className="rzp-field-label">Popular Banks</span>
                    <div className="rzp-banks-grid">
                      {POPULAR_BANKS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className={`rzp-bank-tile ${selectedBank === b.name ? 'selected' : ''}`}
                          onClick={() => setSelectedBank(b.name)}
                        >
                          <span className="rzp-bank-code">{b.code}</span>
                          <span className="rzp-bank-name">{b.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="rzp-more-banks-wrap">
                      <label className="rzp-field-label">More Banks</label>
                      <select
                        className="rzp-select-input"
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                      >
                        <option value="">Select other bank</option>
                        {MORE_BANKS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. EMI */}
              <div className={`rzp-row-item ${expandedMethod === 'emi' ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="rzp-row-header"
                  onClick={() => handleToggleMethod('emi')}
                >
                  <div className="rzp-row-left">
                    <div className="rzp-row-icon rzp-icon-emi">
                      <Percent size={18} />
                    </div>
                    <div className="rzp-row-meta">
                      <span className="rzp-method-title">EMI</span>
                      <span className="rzp-method-subtitle">Credit / Debit Card EMI</span>
                    </div>
                  </div>
                  <div className="rzp-row-right">
                    <span className="rzp-green-pill">No Cost EMI</span>
                    {expandedMethod === 'emi' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {expandedMethod === 'emi' && (
                  <div className="rzp-row-content">
                    <div className="rzp-emi-options">
                      <label
                        className={`rzp-emi-option ${selectedEmi === '3m' ? 'selected' : ''}`}
                        onClick={() => setSelectedEmi('3m')}
                      >
                        <input
                          type="radio"
                          name="emi_plan"
                          checked={selectedEmi === '3m'}
                          onChange={() => setSelectedEmi('3m')}
                        />
                        <div className="rzp-emi-text">
                          <span className="rzp-emi-tenure">3 Months @ {formatCurrency(emi3Month)}/mo</span>
                          <span className="rzp-emi-note">Zero convenience fee</span>
                        </div>
                      </label>

                      <label
                        className={`rzp-emi-option ${selectedEmi === '6m' ? 'selected' : ''}`}
                        onClick={() => setSelectedEmi('6m')}
                      >
                        <input
                          type="radio"
                          name="emi_plan"
                          checked={selectedEmi === '6m'}
                          onChange={() => setSelectedEmi('6m')}
                        />
                        <div className="rzp-emi-text">
                          <span className="rzp-emi-tenure">6 Months @ {formatCurrency(emi6Month)}/mo</span>
                          <span className="rzp-emi-note">Standard interest applied</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. WALLET */}
              <div className={`rzp-row-item ${expandedMethod === 'wallet' ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="rzp-row-header"
                  onClick={() => handleToggleMethod('wallet')}
                >
                  <div className="rzp-row-left">
                    <div className="rzp-row-icon rzp-icon-wallet">
                      <Wallet size={18} />
                    </div>
                    <div className="rzp-row-meta">
                      <span className="rzp-method-title">Wallet</span>
                      <span className="rzp-method-subtitle">Paytm, PhonePe, Amazon Pay</span>
                    </div>
                  </div>
                  <div className="rzp-row-right">
                    {expandedMethod === 'wallet' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {expandedMethod === 'wallet' && (
                  <div className="rzp-row-content">
                    <div className="rzp-wallets-grid">
                      {WALLET_PROVIDERS.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          className={`rzp-wallet-chip ${selectedWallet === w.id ? 'selected' : ''}`}
                          onClick={() => setSelectedWallet(w.id)}
                        >
                          <span className="rzp-wallet-icon">{w.icon}</span>
                          <span className="rzp-wallet-name">{w.name}</span>
                          {selectedWallet === w.id && <Check size={14} className="rzp-wallet-check" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 6. PAY LATER */}
              <div className={`rzp-row-item ${expandedMethod === 'paylater' ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="rzp-row-header"
                  onClick={() => handleToggleMethod('paylater')}
                >
                  <div className="rzp-row-left">
                    <div className="rzp-row-icon rzp-icon-paylater">
                      <Clock size={18} />
                    </div>
                    <div className="rzp-row-meta">
                      <span className="rzp-method-title">Pay Later</span>
                      <span className="rzp-method-subtitle">Simpl, LazyPay, ICICI PayLater</span>
                    </div>
                  </div>
                  <div className="rzp-row-right">
                    {expandedMethod === 'paylater' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {expandedMethod === 'paylater' && (
                  <div className="rzp-row-content">
                    <div className="rzp-paylater-list">
                      {PAY_LATER_PROVIDERS.map((p) => (
                        <label
                          key={p.id}
                          className={`rzp-paylater-option ${selectedPayLater === p.id ? 'selected' : ''}`}
                          onClick={() => setSelectedPayLater(p.id)}
                        >
                          <input
                            type="radio"
                            name="paylater_provider"
                            checked={selectedPayLater === p.id}
                            onChange={() => setSelectedPayLater(p.id)}
                          />
                          <div className="rzp-paylater-info">
                            <span className="rzp-paylater-title">{p.name}</span>
                            <span className="rzp-paylater-badge">{p.badge}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pay / Continue CTA */}
            <div className="rzp-pay-action-wrap">
              <button
                type="button"
                className="rzp-dark-btn rzp-pay-btn"
                disabled={submitting}
                onClick={handleFinalPay}
              >
                <Lock size={15} />
                <span>
                  {submitting ? 'Processing Payment…' : `Pay ${formatCurrency(cart.total)}`}
                </span>
              </button>

              <div className="rzp-secured-by">
                <span className="rzp-secured-text">Secured by</span>
                <span className="rzp-brand-logo">Razorpay</span>
                <span className="rzp-secured-divider">•</span>
                <span className="rzp-secured-sub">100% Safe & Secure</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
