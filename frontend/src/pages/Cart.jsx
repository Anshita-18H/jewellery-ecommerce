import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeCartItem } from '../api';
import './Cart.css';

export default function Cart({ onCartChange }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  function loadCart() {
    setLoading(true);
    getCart()
      .then(setCart)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function handleQuantityChange(productId, quantity) {
    if (quantity < 1) return;
    await updateCartItem(productId, quantity);
    loadCart();
    onCartChange?.();
  }

  async function handleRemove(productId) {
    await removeCartItem(productId);
    loadCart();
    onCartChange?.();
  }

  if (loading) return <p className="cart-status container">Loading cart…</p>;

  if (cart.items.length === 0) {
    return (
      <div className="cart-page container cart-empty">
        <p className="eyebrow">Your Bag</p>
        <h1 className="cart-empty-title">Your cart is empty</h1>
        <Link to="/shop" className="btn btn-gold">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="cart-page container">
      <p className="eyebrow">Your Bag</p>
      <h1 className="cart-title">Shopping Cart</h1>

      <div className="cart-grid">
        <div className="cart-items">
          {cart.items.map((item) => (
            <div key={item.cart_item_id} className="cart-item">
              <img src={item.image_url} alt={item.name} className="cart-item-img" />
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p className="cart-item-price">Rs.{Number(item.price).toLocaleString()} </p>
              </div>
              <div className="pd-qty cart-item-qty">
                <button onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                >
                  +
                </button>
              </div>
              <p className="cart-item-subtotal">{item.subtotal.toLocaleString()}</p>
              <button className="cart-item-remove" onClick={() => handleRemove(item.product_id)} aria-label="Remove item">
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span> Rs.{cart.total.toLocaleString()} </span>
          </div>
          <div className="cart-summary-row cart-summary-note">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="cart-summary-total">
            <span>Total</span>
            <span>Rs.{cart.total.toLocaleString()} </span>
          </div>
          <button className="btn btn-gold cart-checkout-btn" onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}