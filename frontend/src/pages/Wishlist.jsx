import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { addToCart } from '../api';
import './Wishlist.css';

export default function Wishlist({ onCartChange }) {
  const { wishlistItems, removeFromWishlist, clearWishlist, showToast } = useWishlist();
  const [addingId, setAddingId] = useState(null);
  const [addedMap, setAddedMap] = useState({});

  async function handleAddToCart(product) {
    if (!product || !product.id) return;
    setAddingId(product.id);
    try {
      await addToCart(product.id, 1);
      onCartChange?.();
      showToast(`Added ${product.name} to cart`);
      setAddedMap((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedMap((prev) => ({ ...prev, [product.id]: false }));
      }, 2000);
    } catch (err) {
      showToast(err.message || 'Unable to add to cart');
    } finally {
      setAddingId(null);
    }
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-page container wishlist-empty">
        <div className="wishlist-empty-card">
          <div className="wishlist-empty-icon-wrap">
            <Heart size={32} className="wishlist-empty-icon" aria-hidden="true" focusable="false" />
          </div>
          <p className="eyebrow">Your Collection</p>
          <h1 className="wishlist-empty-title">Your Wishlist is Waiting</h1>
          <p className="wishlist-empty-desc">
            Save the pieces you love and they&apos;ll appear here.
          </p>
          <div className="wishlist-empty-actions">
            <Link to="/shop" className="btn btn-gold wishlist-empty-btn">
              Explore Jewellery
            </Link>
            <Link to="/shop" className="btn btn-outline wishlist-empty-secondary-btn">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page container">
      <div className="wishlist-header">
        <div className="wishlist-header-text">
          <p className="eyebrow">AURA Keepsakes</p>
          <h1 className="wishlist-title">My Wishlist</h1>
          <p className="wishlist-subtitle">Pieces you&apos;ve saved for your next timeless moment.</p>
        </div>
        <div className="wishlist-header-actions">
          <Link to="/shop" className="btn btn-outline wishlist-continue-btn">
            Continue Shopping
          </Link>
          <button
            type="button"
            className="wishlist-clear-btn"
            onClick={clearWishlist}
            aria-label="Clear all items from wishlist"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="wishlist-count-bar">
        <span>
          {wishlistItems.length} {wishlistItems.length === 1 ? 'saved piece' : 'saved pieces'}
        </span>
      </div>

      <div className="wishlist-grid">
        {wishlistItems.map((product) => (
          <div key={product.id} className="product-card wishlist-card">
            <div className="product-card-media">
              <Link to={`/product/${product.slug}`} className="product-card-image-link">
                <img src={product.image_url} alt={product.name} className="product-card-image" />
              </Link>
              <button
                type="button"
                className="product-card-wishlist-btn active"
                onClick={() => removeFromWishlist(product.id)}
                aria-label={`Remove ${product.name} from wishlist`}
                title="Remove from wishlist"
              >
                <Heart
                  size={17}
                  className="product-card-heart-icon"
                  fill="var(--gold)"
                  stroke="var(--gold)"
                  aria-hidden="true"
                  focusable="false"
                />
              </button>
            </div>

            <div className="product-card-body">
              {product.category_name && <p className="product-card-eyebrow">{product.category_name}</p>}
              <Link to={`/product/${product.slug}`}>
                <h3 className="product-card-name">{product.name}</h3>
              </Link>
              <p className="product-card-price">Rs. {Number(product.price).toLocaleString()}</p>

              <button
                type="button"
                className="btn btn-gold product-card-btn wishlist-add-cart-btn"
                onClick={() => handleAddToCart(product)}
                disabled={addingId === product.id || product.stock === 0}
              >
                {product.stock === 0
                  ? 'Out of Stock'
                  : addedMap[product.id]
                  ? 'Added to Cart ✓'
                  : addingId === product.id
                  ? 'Adding…'
                  : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
