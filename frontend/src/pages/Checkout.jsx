import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCart, placeOrder } from '../api';
import './Checkout.css';

export default function Checkout({ onCartChange }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    getCart()
      .then(setCart)
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
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
          <strong>Rs.{Number(orderPlaced.total).toLocaleString()} </strong>. We'll reach out on{' '}
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
            <input name="phone" value={form.phone} onChange={handleChange} required type="tel" />
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
            {submitting ? 'Placing Order…' : `Place Order — $${cart.total.toLocaleString()} USD`}
          </button>
          <p className="checkout-note">Guest checkout — no account needed. Payment collected on delivery for now.</p>
        </form>

        <div className="checkout-summary">
          <h3>Order Summary</h3>
          {cart.items.map((item) => (
            <div key={item.cart_item_id} className="checkout-summary-item">
              <span>{item.name} × {item.quantity}</span>
              <span>Rs.{item.subtotal.toLocaleString()}</span>
            </div>
          ))}
          <div className="checkout-summary-total">
            <span>Total</span>
            <span>Rs.{cart.total.toLocaleString()} </span>
          </div>
        </div>
      </div>
    </div>
  );
}