import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories, addToCart } from '../api';
import './Shop.css';

const OCCASION_NAMES = {
  bridal: 'Bridal Edit',
  gifting: 'Gifting Jewellery',
  everyday: 'Everyday Wear',
};

const GENDER_NAMES = {
  women: 'Women Jewellery',
  men: 'Men Jewellery',
  kids: 'Kids Jewellery',
};

export default function Shop({ onCartChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const activeOccasion = searchParams.get('occasion') || '';
  const activeGender = searchParams.get('gender') || '';
  const activeMinPrice = searchParams.get('min_price') || '';
  const activeMaxPrice = searchParams.get('max_price') || '';

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [minPriceInput, setMinPriceInput] = useState(activeMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(activeMaxPrice);
  const [priceError, setPriceError] = useState('');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setMinPriceInput(searchParams.get('min_price') || '');
    setMaxPriceInput(searchParams.get('max_price') || '');
    setPriceError('');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory) params.category = activeCategory;
    if (activeOccasion) params.occasion = activeOccasion;
    if (activeGender) params.gender = activeGender;
    if (activeMinPrice) params.min_price = activeMinPrice;
    if (activeMaxPrice) params.max_price = activeMaxPrice;
    if (searchParams.get('search')) params.search = searchParams.get('search');

    getProducts(params)
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeCategory, activeOccasion, activeGender, activeMinPrice, activeMaxPrice, searchParams]);

  function handleCategoryClick(slug) {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('category', slug);
    else next.delete('category');
    setSearchParams(next);
  }

  function handleClearOccasion() {
    const next = new URLSearchParams(searchParams);
    next.delete('occasion');
    setSearchParams(next);
  }

  function handleClearGender() {
    const next = new URLSearchParams(searchParams);
    next.delete('gender');
    setSearchParams(next);
  }

  function handlePriceSubmit(e) {
    e.preventDefault();
    setPriceError('');
    const minVal = minPriceInput.trim();
    const maxVal = maxPriceInput.trim();

    if (minVal && isNaN(Number(minVal))) {
      setPriceError('Min price must be a valid number');
      return;
    }
    if (maxVal && isNaN(Number(maxVal))) {
      setPriceError('Max price must be a valid number');
      return;
    }
    if (minVal && maxVal && Number(minVal) > Number(maxVal)) {
      setPriceError('Min price cannot be greater than Max price');
      return;
    }

    const next = new URLSearchParams(searchParams);
    if (minVal) next.set('min_price', minVal);
    else next.delete('min_price');

    if (maxVal) next.set('max_price', maxVal);
    else next.delete('max_price');

    setSearchParams(next);
  }

  function handleClearPrice() {
    setMinPriceInput('');
    setMaxPriceInput('');
    setPriceError('');
    const next = new URLSearchParams(searchParams);
    next.delete('min_price');
    next.delete('max_price');
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

  const currentOccasionLabel = activeOccasion
    ? OCCASION_NAMES[activeOccasion.toLowerCase()] ||
      activeOccasion.charAt(0).toUpperCase() + activeOccasion.slice(1)
    : null;

  const currentGenderLabel = activeGender
    ? GENDER_NAMES[activeGender.toLowerCase()] ||
      activeGender.charAt(0).toUpperCase() + activeGender.slice(1)
    : null;

  const currentCategoryName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)?.name || ''
    : '';

  const getPageTitle = () => {
    if (currentGenderLabel && currentOccasionLabel) return `${currentGenderLabel} • ${currentOccasionLabel}`;
    if (currentGenderLabel) return currentGenderLabel;
    if (currentOccasionLabel) return currentOccasionLabel;
    if (currentCategoryName) return `${currentCategoryName} Collection`;
    return 'Shop All Jewellery';
  };

  const getEyebrow = () => {
    if (currentGenderLabel) return 'Curated For You';
    if (currentOccasionLabel) return 'Curated Occasion';
    return 'Collections';
  };

  return (
    <div className="shop-page container">
      <div className="shop-header">
        <p className="eyebrow">{getEyebrow()}</p>
        <h1 className="shop-title">{getPageTitle()}</h1>
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

        <form className="shop-price-filter" onSubmit={handlePriceSubmit}>
          <div className="shop-price-inputs">
            <div className="shop-price-input-wrap">
              <span className="shop-price-prefix">₹</span>
              <input
                type="number"
                min="0"
                placeholder="Min Price"
                value={minPriceInput}
                onChange={(e) => {
                  setMinPriceInput(e.target.value);
                  setPriceError('');
                }}
              />
            </div>
            <span className="shop-price-separator">–</span>
            <div className="shop-price-input-wrap">
              <span className="shop-price-prefix">₹</span>
              <input
                type="number"
                min="0"
                placeholder="Max Price"
                value={maxPriceInput}
                onChange={(e) => {
                  setMaxPriceInput(e.target.value);
                  setPriceError('');
                }}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-outline shop-price-btn">Apply</button>
          {(activeMinPrice || activeMaxPrice) && (
            <button
              type="button"
              className="shop-price-reset-btn"
              onClick={handleClearPrice}
              title="Clear price filter"
            >
              <X size={14} />
            </button>
          )}
          {priceError && <span className="shop-price-error">{priceError}</span>}
        </form>

        <form className="shop-search" onSubmit={handleSearchSubmit}>
          <div className="shop-search-wrap">
            <Search size={16} className="shop-search-icon" />
            <input
              type="text"
              placeholder="Search jewellery…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline">Search</button>
        </form>
      </div>

      {currentOccasionLabel && (
        <div className="shop-active-occasion-banner">
          <span className="shop-active-occasion-text">
            Filtering by occasion: <strong>{currentOccasionLabel}</strong>
          </span>
          <button
            type="button"
            className="shop-clear-occasion-btn"
            onClick={handleClearOccasion}
            title="Clear occasion filter"
          >
            Clear Occasion <X size={14} />
          </button>
        </div>
      )}

      {currentGenderLabel && (
        <div className="shop-active-occasion-banner">
          <span className="shop-active-occasion-text">
            Filtering by gender: <strong>{currentGenderLabel}</strong>
          </span>
          <button
            type="button"
            className="shop-clear-occasion-btn"
            onClick={handleClearGender}
            title="Clear gender filter"
          >
            Clear Gender <X size={14} />
          </button>
        </div>
      )}

      {(activeMinPrice || activeMaxPrice) && (
        <div className="shop-active-occasion-banner">
          <span className="shop-active-occasion-text">
            Filtering by price:{' '}
            <strong>
              {activeMinPrice && activeMaxPrice
                ? `₹${Number(activeMinPrice).toLocaleString()} – ₹${Number(activeMaxPrice).toLocaleString()}`
                : activeMinPrice
                ? `Min ₹${Number(activeMinPrice).toLocaleString()}`
                : `Max ₹${Number(activeMaxPrice).toLocaleString()}`}
            </strong>
          </span>
          <button
            type="button"
            className="shop-clear-occasion-btn"
            onClick={handleClearPrice}
            title="Clear price filter"
          >
            Clear Price <X size={14} />
          </button>
        </div>
      )}

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