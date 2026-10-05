import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCart } from '../api';
import { formatCurrency } from '../utils/format';
import './Checkout.css';

export default function Checkout({ onCartChange }) {
  const { user, login, signup, logout } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [error, setError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);
  const [pincodeError, setPincodeError] = useState(null);

  // Checkout Mode Tab: 'guest' (default) vs 'auth'
  const [checkoutTab, setCheckoutTab] = useState(user ? 'auth' : 'guest');

  // Embedded Auth form states
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });

  const PHONE_REGEX = /^(\+91)?[0-9]{10}$/;
  const PINCODE_REGEX = /^[0-9]{6}$/;

  useEffect(() => {
    getCart()
      .then(setCart)
      .finally(() => setLoading(false));
  }, []);

  // When user is authenticated or logs in, auto-prefill contact fields
  useEffect(() => {
    if (user) {
      setCheckoutTab('auth');
      setForm((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  function handleTabSwitch(tab) {
    setCheckoutTab(tab);
    setAuthError(null);
  }

  // Handle embedded login / signup submission
  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError(null);

    const cleanEmail = authEmail.trim();
    if (!cleanEmail) {
      setAuthError('Please enter your email address');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    if (authMode === 'signup' && (!authName || !authName.trim())) {
      setAuthError('Please enter your full name');
      return;
    }

    setAuthLoading(true);
    try {
      let res;
      if (authMode === 'signup') {
        res = await signup({ name: authName.trim(), email: cleanEmail, password: authPassword });
      } else {
        res = await login({ email: cleanEmail, password: authPassword });
      }
      const authenticatedUser = res?.user;
      if (authenticatedUser) {
        setForm((prev) => ({
          ...prev,
          customer_name: prev.customer_name || authenticatedUser.name || '',
          phone: prev.phone || authenticatedUser.phone || '',
        }));
      }
      setCheckoutTab('auth');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }

  function handleGoogleLogin() {
    navigate('/google-login-success');
  }

  async function handleSignOut() {
    try {
      await logout();
    } finally {
      setCheckoutTab('guest');
    }
  }

  function formatPhoneInput(val) {
    if (!val) return '';
    // If starts with +, allow a single leading +91 followed by digits
    if (val.startsWith('+')) {
      const rest = val.slice(1).replace(/\D/g, '');
      if (rest.length === 0) return '+';
      if (rest[0] !== '9') return '+';
      if (rest.length === 1) return '+9';
      if (rest[1] !== '1') return '+9';
      // Starts with +91, allow up to 10 digits after +91
      return '+91' + rest.slice(2, 12);
    }
    // Does not start with +, only allow digits up to 10 characters
    return val.replace(/\D/g, '').slice(0, 10);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handlePhoneChange(e) {
    const formatted = formatPhoneInput(e.target.value);
    setForm((prev) => ({ ...prev, phone: formatted }));
    if (phoneError) {
      setPhoneError(null);
    }
  }

  function handlePincodeChange(e) {
    const formatted = e.target.value.replace(/\D/g, '').slice(0, 6);
    setForm((prev) => ({ ...prev, pincode: formatted }));
    if (pincodeError) {
      setPincodeError(null);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setPhoneError(null);
    setPincodeError(null);
    setError(null);

    let hasError = false;

    if (!PHONE_REGEX.test(form.phone.trim())) {
      setPhoneError('Enter a valid 10-digit phone number, with or without +91');
      hasError = true;
    }

    if (!PINCODE_REGEX.test(form.pincode.trim())) {
      setPincodeError('Enter a valid 6-digit pincode');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    navigate('/payment', { state: { deliveryDetails: form, cart } });
  }

  if (loading) return <p className="checkout-status container">Loading…</p>;

  if (orderPlaced) {
    return (
      <div className="checkout-page container checkout-success">
        <p className="eyebrow">Order Confirmed</p>
        <h1>Thank you, {form.customer_name.split(' ')[0]}.</h1>
        <p className="checkout-success-text">
          Your order <strong>#{orderPlaced.order_id}</strong> has been placed for{' '}
          <strong>{formatCurrency(orderPlaced.total)}</strong>. We'll reach out on{' '}
          <strong>{form.phone}</strong> with delivery updates.
        </p>
        <Link to="/shop" className="btn btn-gold">Continue Shopping</Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="checkout-page container checkout-success">
        <h1>Your cart is empty</h1>
        <Link to="/shop" className="btn btn-gold">Go to Shop</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page container">
      <p className="eyebrow">Checkout</p>
      <h1 className="checkout-title">
        {checkoutTab === 'auth' && !user ? 'Sign In or Create Account' : 'Delivery Details'}
      </h1>

      {/* Checkout Mode Tabs: Login/Sign Up vs Guest User */}
      <div className="checkout-auth-tabs-wrap">
        <div className="checkout-auth-tabs" role="tablist" aria-label="Checkout account options">
          <button
            type="button"
            role="tab"
            aria-selected={checkoutTab === 'auth'}
            className={`checkout-auth-tab ${checkoutTab === 'auth' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('auth')}
          >
            {user ? (
              <>
                <CheckCircle2 size={15} className="checkout-tab-icon" />
                <span>Account ({user.name.split(' ')[0]})</span>
              </>
            ) : (
              <>
                <User size={15} className="checkout-tab-icon" />
                <span>Login / Sign Up</span>
              </>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={checkoutTab === 'guest'}
            className={`checkout-auth-tab ${checkoutTab === 'guest' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('guest')}
          >
            <span>Guest User</span>
          </button>
        </div>
      </div>

      <div className="checkout-grid">
        <div className="checkout-main-content">
          {/* AUTH VIEW: When user chose Login/Sign Up tab and is NOT yet logged in */}
          {checkoutTab === 'auth' && !user && (
            <div className="checkout-auth-card">
              <div className="checkout-auth-header">
                <p className="eyebrow">AURA Privilege</p>
                <h2>{authMode === 'login' ? 'Sign In to Your Account' : 'Create an Account'}</h2>
                <p>
                  {authMode === 'login'
                    ? 'Sign in to link this order with your account and track it later.'
                    : 'Join AURA to link your orders and access your private wishlist.'}
                </p>
              </div>

              {/* Sub-tabs: Sign In vs Create Account */}
              <div className="checkout-auth-subtabs">
                <button
                  type="button"
                  className={`checkout-auth-subtab ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`checkout-auth-subtab ${authMode === 'signup' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                  }}
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div className="checkout-auth-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{authError}</span>
                </div>
              )}

              <form className="checkout-auth-form" onSubmit={handleAuthSubmit} noValidate>
                {authMode === 'signup' && (
                  <div className="checkout-auth-field">
                    <label className="checkout-auth-label" htmlFor="checkout-auth-name">
                      Full Name
                    </label>
                    <div className="checkout-auth-input-wrap">
                      <User size={16} className="checkout-auth-input-icon" />
                      <input
                        id="checkout-auth-name"
                        type="text"
                        className="checkout-auth-input"
                        placeholder="Enter your full name"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        disabled={authLoading}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="checkout-auth-field">
                  <label className="checkout-auth-label" htmlFor="checkout-auth-email">
                    Email Address
                  </label>
                  <div className="checkout-auth-input-wrap">
                    <Mail size={16} className="checkout-auth-input-icon" />
                    <input
                      id="checkout-auth-email"
                      type="email"
                      className="checkout-auth-input"
                      placeholder="you@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      disabled={authLoading}
                      required
                    />
                  </div>
                </div>

                <div className="checkout-auth-field">
                  <label className="checkout-auth-label" htmlFor="checkout-auth-password">
                    Password
                  </label>
                  <div className="checkout-auth-input-wrap">
                    <Lock size={16} className="checkout-auth-input-icon" />
                    <input
                      id="checkout-auth-password"
                      type={showAuthPassword ? 'text' : 'password'}
                      className="checkout-auth-input checkout-auth-input-password"
                      placeholder="At least 6 characters"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      disabled={authLoading}
                      required
                    />
                    <button
                      type="button"
                      className="checkout-auth-password-toggle"
                      onClick={() => setShowAuthPassword((prev) => !prev)}
                      aria-label={showAuthPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAuthPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-gold checkout-auth-submit-btn"
                  disabled={authLoading}
                >
                  {authLoading ? (
                    'Processing…'
                  ) : authMode === 'login' ? (
                    <>
                      Sign In & Continue <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      Create Account & Continue <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Social Login Divider */}
              <div className="checkout-auth-divider" role="separator" aria-label="Alternative sign-in option">
                <span className="checkout-auth-divider-line" />
                <span className="checkout-auth-divider-text">OR</span>
                <span className="checkout-auth-divider-line" />
              </div>

              {/* Mock Google Login Button */}
              <button
                type="button"
                className="checkout-auth-google-btn"
                onClick={handleGoogleLogin}
                aria-label="Continue with Google"
              >
                <svg
                  className="checkout-auth-google-icon"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="checkout-auth-switch">
                {authMode === 'login' ? (
                  <p>
                    Don&apos;t have an account yet?
                    <button
                      type="button"
                      className="checkout-auth-switch-btn"
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthError(null);
                      }}
                    >
                      Create one here
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?
                    <button
                      type="button"
                      className="checkout-auth-switch-btn"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError(null);
                      }}
                    >
                      Sign in here
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* GUEST VIEW WHEN LOGGED IN: Gives option to sign out for pure guest checkout */}
          {checkoutTab === 'guest' && user && (
            <div className="checkout-guest-logged-card">
              <p>
                You are currently signed in as <strong>{user.name}</strong> ({user.email}).
              </p>
              <p>
                To place this order as a guest without linking it to your account, sign out:
              </p>
              <div className="checkout-guest-logged-actions">
                <button
                  type="button"
                  className="checkout-signout-btn"
                  onClick={handleSignOut}
                >
                  <LogOut size={14} /> Sign Out & Continue as Guest
                </button>
                <button
                  type="button"
                  className="checkout-inline-link"
                  style={{ marginLeft: '0.75rem', alignSelf: 'center' }}
                  onClick={() => setCheckoutTab('auth')}
                >
                  Keep signed in as {user.name.split(' ')[0]}
                </button>
              </div>
            </div>
          )}

          {/* LOGGED IN ACCOUNT BANNER (When on Account tab and logged in) */}
          {checkoutTab === 'auth' && user && (
            <div className="checkout-user-banner">
              <div className="checkout-user-info">
                <CheckCircle2 size={22} className="checkout-user-icon" />
                <div>
                  <p className="checkout-user-title">
                    Signed in as <strong>{user.name}</strong> ({user.email})
                  </p>
                  <p className="checkout-user-sub">
                    This order will be automatically linked to your account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="checkout-signout-btn"
                onClick={handleSignOut}
                title="Sign out of this account"
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          )}

          {/* GUEST NOTICE BANNER (When on Guest tab and not logged in) */}
          {checkoutTab === 'guest' && !user && (
            <div className="checkout-guest-banner">
              <User size={16} className="checkout-guest-icon" />
              <span>
                Checking out as guest. Have an account?{' '}
                <button
                  type="button"
                  className="checkout-inline-link"
                  onClick={() => handleTabSwitch('auth')}
                >
                  Sign in
                </button>{' '}
                to link this order to your account.
              </span>
            </div>
          )}

          {/* DELIVERY DETAILS FORM: Shown for guest mode OR when authenticated on auth mode */}
          {(checkoutTab === 'guest' || (checkoutTab === 'auth' && user)) && (
            <form className="checkout-form" onSubmit={handleSubmit}>
              <label>
                Full Name
                <input
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Anshita Hedau"
                />
              </label>
              <label>
                Phone Number
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  required
                  type="tel"
                  placeholder="e.g. 9876543210 or +919876543210"
                  className={phoneError ? 'input-error' : ''}
                  autoComplete="tel"
                />
                {phoneError && <span className="checkout-field-error">{phoneError}</span>}
              </label>
              <label>
                Address
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  placeholder="House/flat no., street, landmark"
                />
              </label>
              <div className="checkout-form-row">
                <label>
                  City
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Indore"
                  />
                </label>
                <label>
                  Pincode
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={handlePincodeChange}
                    required
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 452001"
                    className={pincodeError ? 'input-error' : ''}
                    autoComplete="postal-code"
                  />
                  {pincodeError && <span className="checkout-field-error">{pincodeError}</span>}
                </label>
              </div>

              {error && <p className="checkout-error">{error}</p>}

              <button type="submit" className="btn btn-gold checkout-submit">
                Proceed to Payment — {formatCurrency(cart.total)}
              </button>
              <p className="checkout-note">
                {user
                  ? 'Safe & secure payment options. Order will appear in your account history.'
                  : 'Guest checkout — no account needed. Safe & secure payment options.'}
              </p>
            </form>
          )}
        </div>

        {/* ORDER SUMMARY (Always visible on right) */}
        <div className="checkout-summary">
          <h3>Order Summary</h3>
          {cart.items.map((item) => (
            <div key={item.cart_item_id} className="checkout-summary-item">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
          <div className="checkout-summary-item" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <span>Insured Shipping</span>
            <span>Free</span>
          </div>
          <div className="checkout-summary-total">
            <span>Total</span>
            <span>{formatCurrency(cart.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}