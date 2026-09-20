import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCart, placeOrder } from '../api';
import { formatCurrency } from '../utils/format';
import './Checkout.css';

export default function Checkout({ onCartChange }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [error, setError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });
  const navigate = useNavigate();

  const PHONE_REGEX = /^(\+91)?[0-9]{10}$/;

  useEffect(() => {
    getCart()
      .then(setCart)
      .finally(() => setLoading(false));
  }, []);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setPhoneError(null);
    setError(null);

    if (!PHONE_REGEX.test(form.phone.trim())) {
      setPhoneError('Enter a valid 10-digit phone number, with or without +91');
      return;
    }

    setSubmitting(true);
    try {
      const result = await placeOrder(form);
      setOrderPlaced(result);
      onCartChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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
      <h1 className="checkout-title">Delivery Details</h1>

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input name="customer_name" value={form.customer_name} onChange={handleChange} required />
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
            <input name="address" value={form.address} onChange={handleChange} required />
          </label>
          <div className="checkout-form-row">
            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>
            <label>
              Pincode
              <input name="pincode" value={form.pincode} onChange={handleChange} required />
            </label>
          </div>

          {error && <p className="checkout-error">{error}</p>}

          <button type="submit" className="btn btn-gold checkout-submit" disabled={submitting}>
            {submitting ? 'Placing Order…' : `Place Order — ${formatCurrency(cart.total)}`}
          </button>
          <p className="checkout-note">Guest checkout — no account needed. Payment collected on delivery for now.</p>
        </form>

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