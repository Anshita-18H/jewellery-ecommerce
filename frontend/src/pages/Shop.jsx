import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories, addToCart } from '../api';
import './Shop.css';

export default function Shop({ onCartChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory) params.category = activeCategory;
    if (searchParams.get('search')) params.search = searchParams.get('search');

    getProducts(params)
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeCategory, searchParams]);

  function handleCategoryClick(slug) {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('category', slug);
    else next.delete('category');
    setSearchParams(next);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput) next.set('search', searchInput);
    else next.delete('search');
    setSearchParams(next);
  }

  async function handleAddToCart(product) {
    try {
      await addToCart(product.id, 1);
      onCartChange?.();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="shop-page container">
      <div className="shop-header">
        <p className="eyebrow">Collections</p>
        <h1 className="shop-title">Shop All Jewellery</h1>
      </div>

      <div className="shop-toolbar">
        <div className="shop-categories">
          <button className={`shop-chip ${!activeCategory ? 'active' : ''}`} onClick={() => handleCategoryClick('')}>
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`shop-chip ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <form className="shop-search" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search jewellery…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-outline">Search</button>
        </form>
      </div>

      {loading && <p className="shop-status">Loading products…</p>}
      {error && <p className="shop-status shop-error">Couldn't load products: {error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="shop-status">No products found. Try a different filter.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="shop-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
}