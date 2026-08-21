import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import GalleryBanner from '../components/GalleryBanner';
import { getProducts, addToCart } from '../api';
import './Home.css';

export default function Home({ onCartChange }) {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProducts({ featured: 'true' })
      .then((data) => setFeatured(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddToCart(product) {
    try {
      await addToCart(product.id, 1);
      onCartChange?.();
    } catch (err) {
      alert(err.message);
    }
  }

  const heroProduct = featured[0];

  return (
    <div>
      <Hero product={heroProduct} />

      <section className="home-collections container">
        <h2 className="section-title">Featured Collections</h2>

        {loading && <p className="home-status">Loading collections…</p>}
        {error && <p className="home-status home-error">Couldn't load products: {error}</p>}

        {!loading && !error && (
          <div className="home-collections-grid">
            {featured.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </section>

      <GalleryBanner />
    </div>
  );
}