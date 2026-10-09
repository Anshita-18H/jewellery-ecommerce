import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeCartItem } from '../api';
import { formatCurrency } from '../utils/format';
import './Cart.css';

export default function Cart({ onCartChange }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCart()
      .then(setCart)
      .finally(() => setLoading(false));
  }, []);

  async function handleQuantityChange(productId, newQuantity) {
    if (newQuantity < 1) return;

    // 1. Optimistic smooth update: immediately update item quantity & totals
    setCart((prevCart) => {
      const updatedItems = prevCart.items.map((item) => {
        if (item.product_id === productId) {
          const clampedQty = item.stock ? Math.min(newQuantity, item.stock) : newQuantity;
          return {
            ...item,
            quantity: clampedQty,
            subtotal: Number(item.price) * clampedQty,
          };
        }
        return item;
      });
      const newTotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
      return { ...prevCart, items: updatedItems, total: newTotal };
    });

    try {
      // 2. Persist to server in background without page reload or loading flicker
      await updateCartItem(productId, newQuantity);
      const refreshedCart = await getCart();
      setCart(refreshedCart);
      onCartChange?.();
    } catch (err) {
      console.error('Failed to update cart quantity:', err);
      getCart().then(setCart);
    }
  }

  async function handleRemove(productId) {
    // Optimistic smooth removal
    setCart((prevCart) => {
      const filtered = prevCart.items.filter((item) => item.product_id !== productId);
      const newTotal = filtered.reduce((sum, i) => sum + i.subtotal, 0);
      return { ...prevCart, items: filtered, total: newTotal };
    });

    try {
      await removeCartItem(productId);
      const refreshedCart = await getCart();
      setCart(refreshedCart);
      onCartChange?.();
    } catch (err) {
      console.error('Failed to remove cart item:', err);
      getCart().then(setCart);
    }
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
                <p className="cart-item-price">{formatCurrency(item.price)}</p>
              </div>
              <div className="pd-qty cart-item-qty">
                <button type="button" onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <p className="cart-item-subtotal">{formatCurrency(item.subtotal)}</p>
              <button type="button" className="cart-item-remove" onClick={() => handleRemove(item.product_id)} aria-label="Remove item">
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(cart.total)}</span>
          </div>
          <div className="cart-summary-row cart-summary-note">
            <span>Insured Shipping</span>
            <span>Free</span>
          </div>
          <div className="cart-summary-total">
            <span>Total</span>
            <span>{formatCurrency(cart.total)}</span>
          </div>
          <button className="btn btn-gold cart-checkout-btn" onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}