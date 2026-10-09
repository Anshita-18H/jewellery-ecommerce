import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import NewArrivals from '../components/NewArrivals';
import ProductCard from '../components/ProductCard';
import AssuranceSection from '../components/AssuranceSection';
import OccasionGrid from '../components/OccasionGrid';
import GenderGrid from '../components/GenderGrid';
import GalleryBanner from '../components/GalleryBanner';
import { getProducts, addToCart } from '../api';
import './Home.css';

export default function Home({ onCartChange }) {
  const [featured, setFeatured] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getProducts({ featured: 'true' }), getProducts()])
      .then(([featuredData, allData]) => {
        setFeatured(featuredData);
        setAllProducts(allData);
      })
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

  // Products selected for hero banner in Admin panel
  const heroProducts = allProducts.filter((p) => Boolean(p.is_hero_banner));
  // If none explicitly marked, fallback to catalog featured pieces
  const bannerProducts = heroProducts.length > 0 ? heroProducts : featured.slice(0, 3);

  return (
    <div>
      <Hero products={bannerProducts} />

      <AssuranceSection />

      <NewArrivals products={allProducts} />

      <section className="home-collections container">
        <div className="home-section-header text-center">
          <p className="eyebrow">Curated Selection</p>
          <h2 className="section-title">Featured Collections</h2>
          <p className="section-subtitle">Handcrafted fine jewellery sculpted for timeless distinction</p>
        </div>

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

      <OccasionGrid products={allProducts} />

      <GenderGrid products={allProducts} />

      <GalleryBanner />
    </div>
  );
}