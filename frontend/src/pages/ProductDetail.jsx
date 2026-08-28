import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, addToCart } from '../api';
import './ProductDetail.css';

export default function ProductDetail({ onCartChange }) {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setAdded(false);
    getProduct(slug)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleAddToCart() {
    try {
      await addToCart(product.id, quantity);
      onCartChange?.();
      setAdded(true);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <p className="pd-status container">Loading product…</p>;
  if (error) return <p className="pd-status pd-error container">Couldn't load product: {error}</p>;
  if (!product) return null;

  return (
    <div className="pd-page container">
      <p className="pd-breadcrumb">
        <Link to="/shop">Shop</Link> / {product.category_name || 'Product'}
      </p>

      <div className="pd-grid">
        <div className="pd-image-wrap">
          <img src={product.image_url} alt={product.name} className="pd-image" />
        </div>

        <div className="pd-info">
          {product.category_name && <p className="eyebrow">{product.category_name}</p>}
          <h1 className="pd-name">{product.name}</h1>
          <p className="pd-price">Rs {Number(product.price).toLocaleString()} </p>
          <p className="pd-description">{product.description}</p>

          <p className="pd-stock">
            {product.stock > 0 ? `${product.stock} in stock` : 'Currently out of stock'}
          </p>

          {product.stock > 0 && (
            <div className="pd-actions">
              <div className="pd-qty">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}>+</button>
              </div>
              <button className="btn btn-gold pd-add-btn" onClick={handleAddToCart}>
                Add to Cart
              </button>
            </div>
          )}

          {added && (
            <p className="pd-added-msg">
              Added to cart. <Link to="/cart">View cart →</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}