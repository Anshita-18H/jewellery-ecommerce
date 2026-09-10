import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import './ProductCard.css';

export default function ProductCard({ product, onAddToCart }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  function handleWishlistClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  }

  return (
    <div className="product-card">
      <div className="product-card-media">
        <Link to={`/product/${product.slug}`} className="product-card-image-link">
          <img src={product.image_url} alt={product.name} className="product-card-image" />
        </Link>
        <button
          type="button"
          className={`product-card-wishlist-btn ${wishlisted ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart
            size={17}
            className="product-card-heart-icon"
            fill={wishlisted ? 'var(--gold)' : 'none'}
            stroke={wishlisted ? 'var(--gold)' : 'currentColor'}
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
          className="btn btn-outline product-card-btn"
          onClick={() => onAddToCart?.(product)}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}