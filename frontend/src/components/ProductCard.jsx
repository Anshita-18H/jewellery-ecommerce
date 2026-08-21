import { Link } from 'react-router-dom';
import './ProductCard.css';

export default function ProductCard({ product, onAddToCart }) {
  return (
    <div className="product-card">
      <Link to={`/product/${product.slug}`} className="product-card-image-link">
        <img src={product.image_url} alt={product.name} className="product-card-image" />
      </Link>
      <div className="product-card-body">
        {product.category_name && <p className="product-card-eyebrow">{product.category_name}</p>}
        <Link to={`/product/${product.slug}`}>
          <h3 className="product-card-name">{product.name}</h3>
        </Link>
        <p className="product-card-price">{Number(product.price).toLocaleString()} </p>
        <button
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