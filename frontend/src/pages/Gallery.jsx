import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api';
import { formatCurrency } from '../utils/format';
import './Gallery.css';

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProducts()
      .then((allProducts) => {
        const safe = Array.isArray(allProducts) ? allProducts : [];
        const galleryItems = safe.filter((p) => Boolean(p.is_in_gallery));
        // Fallback to active catalog products if none explicitly marked as gallery
        setItems(galleryItems.length > 0 ? galleryItems : safe.slice(0, 6));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="gallery-page container">
      <div className="gallery-page-header">
        <p className="eyebrow">Lookbook</p>
        <h1 className="gallery-page-title">Luxury Gallery</h1>
        <p className="gallery-page-subtitle">
          A closer look at the craftsmanship, settings, and stories behind each piece.
        </p>
      </div>

      {loading && <p className="gallery-status">Loading luxury lookbook…</p>}
      {error && <p className="gallery-status gallery-error">Couldn't load gallery: {error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="gallery-status">
          No gallery pieces selected yet. Please check "Show in Luxury Gallery" on products in the Admin Panel.
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="gallery-page-grid">
          {items.map((prod) => (
            <Link
              key={prod.id}
              to={`/product/${prod.slug}`}
              className="gallery-page-item"
              aria-label={`View ${prod.name} details`}
            >
              <img
                src={prod.image_url || 'https://placehold.co/600x750/1b1712/c9a876?text=AURA'}
                alt={prod.name}
                loading="lazy"
              />
              <figcaption>
                <div className="gallery-caption-info">
                  <span className="gallery-caption-title">{prod.name}</span>
                  {prod.category_name && (
                    <span className="gallery-caption-category">{prod.category_name}</span>
                  )}
                </div>
                {prod.price !== undefined && prod.price !== null && (
                  <span className="gallery-caption-price">{formatCurrency(prod.price)}</span>
                )}
              </figcaption>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}