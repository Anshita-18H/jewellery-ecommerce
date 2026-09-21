import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Gem,
  FolderTree,
  ShoppingBag,
  Users,
  Star,
  Settings,
  LogOut,
  Search,
  X,
  Menu,
  Plus,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus,
  getAdminDashboard,
  getAdminReviews,
  deleteAdminReview,
  getAdminCustomers,
} from '../api';
import { useAdminAuth } from '../context/AdminAuthContext';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute';
import AdminLogin from './AdminLogin';
import StarRating from '../components/StarRating';
import { formatCurrency } from '../utils/format';
import './Admin.css';

const emptyForm = {
  name: '',
  category_id: '',
  description: '',
  price: '',
  stock: '',
  image_url: '',
  is_featured: false,
  occasion_tags: '',
  gender_tag: '',
};

export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminUser, adminLogout } = useAdminAuth();

  // If path is /admin/login, render dedicated AdminLogin page without sidebar/topbar
  const isLoginPage = location.pathname.toLowerCase().includes('/login');

  // Determine active tab from URL hash path (e.g. /admin/products -> products)
  const getTabFromPath = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/products')) return 'products';
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/customers')) return 'customers';
    if (path.includes('/reviews')) return 'reviews';
    if (path.includes('/settings')) return 'settings';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  // Sync tab with URL
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
    navigate(`/admin/${tab}`);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    // If admin enters a search query while on another tab, switch to products to display matching results
    if (query.trim() && activeTab !== 'products') {
      setActiveTab('products');
      navigate('/admin/products');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      navigate('/admin/login');
    } catch {
      navigate('/admin/login');
    }
  };

  // If visiting /admin/login, render dedicated AdminLogin without sidebar/topbar
  if (isLoginPage) {
    return <AdminLogin />;
  }

  return (
    <ProtectedAdminRoute>
      <div className="admin-layout">
      {/* 1. LEFT SIDEBAR */}
      <aside className={`admin-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/admin/dashboard" className="admin-brand" onClick={() => setMobileNavOpen(false)}>
            <span className="admin-brand-emblem">♦</span>
            <div className="admin-brand-info">
              <span className="admin-brand-name">AURA</span>
              <span className="admin-brand-sub">ADMIN PRIVILEGE</span>
            </div>
          </Link>
          <button
            type="button"
            className="admin-mobile-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Admin Navigation">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => handleTabChange('products')}
          >
            <Gem size={18} />
            <span>Products</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => handleTabChange('categories')}
          >
            <FolderTree size={18} />
            <span>Categories</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleTabChange('orders')}
          >
            <ShoppingBag size={18} />
            <span>Orders</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => handleTabChange('customers')}
          >
            <Users size={18} />
            <span>Customers</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => handleTabChange('reviews')}
          >
            <Star size={18} />
            <span>Reviews / Ratings</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <button type="button" className="admin-nav-item admin-logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>

          <div className="admin-profile-pill">
            <div className="admin-avatar">
              {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="admin-profile-meta">
              <span className="admin-profile-name">{adminUser?.name || 'Store Administrator'}</span>
              <span className="admin-profile-role">{adminUser?.role === 'admin' ? 'AURA Concierge (Admin)' : 'Administrator'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          className="admin-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. MAIN ADMIN CONTENT CONTAINER */}
      <div className="admin-main">
        {/* TOPBAR WITH ADMIN SEARCH BAR */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>

            {/* ADMIN SEARCH BAR */}
            <div className="admin-search-wrapper" role="search">
              <Search size={16} className="admin-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search products by name, ID, category..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Search products in admin"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={handleClearSearch}
                  aria-label="Clear search input"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="admin-topbar-right">
            <Link to="/" className="admin-btn-secondary" target="_blank" rel="noreferrer">
              <ExternalLink size={14} />
              <span>View Store</span>
            </Link>

            <div className="admin-live-indicator" title="Connected to Storefront">
              <span className="admin-live-dot" />
              <span className="admin-live-label">Store Online</span>
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="admin-body">
          {activeTab === 'dashboard' && (
            <AdminDashboard
              onNavigate={handleTabChange}
              onEditProduct={(p) => {
                setEditProduct(p);
                handleTabChange('products');
              }}
            />
          )}

          {activeTab === 'products' && (
            <AdminProducts
              searchQuery={searchQuery}
              onClearSearch={handleClearSearch}
              onSearchingStateChange={setIsSearching}
              editProduct={editProduct}
              onClearEdit={() => setEditProduct(null)}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategories onSelectCategory={(catSlug) => {
              setSearchQuery(catSlug);
              handleTabChange('products');
            }} />
          )}

          {activeTab === 'orders' && <AdminOrders />}

          {activeTab === 'customers' && <AdminCustomers />}

          {activeTab === 'reviews' && <AdminReviews />}

          {activeTab === 'settings' && <AdminSettings user={adminUser} />}
        </main>
      </div>
    </div>
    </ProtectedAdminRoute>
  );
}

/* ========================================================
   1. DASHBOARD COMPONENT (REAL DATABASE METRICS)
   ======================================================== */
function AdminDashboard({ onNavigate, onEditProduct }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="admin-status-wrap">
        <RefreshCw size={24} className="admin-spin" />
        <p>Loading real-time store metrics from database…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error-box">
        <AlertTriangle size={24} />
        <div>
          <h4>Could not load Dashboard analytics</h4>
          <p>{error}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={loadDashboard}>
          Retry
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const lowStock = data?.lowStock || [];
  const topRated = data?.topRated || [];
  const recentOrders = data?.recentOrders || [];
  const recentReviews = data?.recentReviews || [];

  return (
    <div className="admin-dashboard-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Real-Time Intelligence</p>
          <h1 className="admin-page-title">AURA ADMIN DASHBOARD</h1>
        </div>
        <button type="button" className="admin-refresh-btn" onClick={loadDashboard} title="Refresh metrics">
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* STATISTIC METRIC CARDS */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card" onClick={() => onNavigate('products')} role="button" tabIndex={0}>
          <div className="admin-metric-icon-wrap icon-gold">
            <Gem size={22} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Total Products</span>
            <span className="admin-metric-value">{metrics.totalProducts ?? 0}</span>
            <span className="admin-metric-hint">Catalog pieces</span>
          </div>
        </div>

        <div className="admin-metric-card" onClick={() => onNavigate('orders')} role="button" tabIndex={0}>
          <div className="admin-metric-icon-wrap icon-cream">
            <ShoppingBag size={22} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Total Orders</span>
            <span className="admin-metric-value">{metrics.totalOrders ?? 0}</span>
            <span className="admin-metric-hint">Completed & pending</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon-wrap icon-accent">
            <TrendingUp size={22} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Total Revenue</span>
            <span className="admin-metric-value">
              {formatCurrency(metrics.totalRevenue || 0)}
            </span>
            <span className="admin-metric-hint">Gross order volume</span>
          </div>
        </div>

        <div className="admin-metric-card" onClick={() => onNavigate('customers')} role="button" tabIndex={0}>
          <div className="admin-metric-icon-wrap icon-gold">
            <Users size={22} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Total Customers</span>
            <span className="admin-metric-value">{metrics.totalCustomers ?? 0}</span>
            <span className="admin-metric-hint">Registered clients</span>
          </div>
        </div>

        <div className="admin-metric-card" onClick={() => onNavigate('reviews')} role="button" tabIndex={0}>
          <div className="admin-metric-icon-wrap icon-gold">
            <Star size={22} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Total Reviews</span>
            <span className="admin-metric-value">{metrics.totalReviews ?? 0}</span>
            <span className="admin-metric-hint">Client testimonials</span>
          </div>
        </div>

        <div className="admin-metric-card" onClick={() => onNavigate('reviews')} role="button" tabIndex={0}>
          <div className="admin-metric-icon-wrap icon-gold">
            <Sparkles size={22} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Average Rating</span>
            <span className="admin-metric-value">
              {metrics.averageRating > 0 ? `${Number(metrics.averageRating).toFixed(1)} ★` : '0.0'}
            </span>
            <span className="admin-metric-hint">Client satisfaction</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD INSIGHTS SECTIONS */}
      <div className="admin-dash-sections-grid">
        {/* Low Stock Alerts */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <AlertTriangle size={18} className="icon-warning" />
              <h3>Low Stock Inventory (≤ 5)</h3>
            </div>
            <button type="button" className="admin-link-btn" onClick={() => onNavigate('products')}>
              View All
            </button>
          </div>

          {lowStock.length === 0 ? (
            <div className="admin-empty-compact">
              <CheckCircle2 size={24} className="icon-success" />
              <p>All jewellery stock levels are healthy.</p>
            </div>
          ) : (
            <div className="admin-compact-list">
              {lowStock.map((item) => (
                <div key={item.id} className="admin-compact-item">
                  <img src={item.image_url} alt={item.name} className="admin-thumb" />
                  <div className="admin-compact-info">
                    <span className="admin-compact-name">{item.name}</span>
                    <span className="admin-compact-price">{formatCurrency(item.price)}</span>
                  </div>
                  <div className="admin-compact-action">
                    <span className="admin-stock-badge low-stock">{item.stock} left</span>
                    <button
                      type="button"
                      className="admin-mini-btn"
                      onClick={() => onEditProduct(item)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Rated Showcase */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <Star size={18} className="icon-gold" />
              <h3>Client Favourites</h3>
            </div>
            <button type="button" className="admin-link-btn" onClick={() => onNavigate('reviews')}>
              All Reviews
            </button>
          </div>

          {topRated.length === 0 ? (
            <div className="admin-empty-compact">
              <Sparkles size={24} className="icon-muted" />
              <p>No ratings submitted yet.</p>
            </div>
          ) : (
            <div className="admin-compact-list">
              {topRated.map((item) => (
                <div key={item.id} className="admin-compact-item">
                  <img src={item.image_url} alt={item.name} className="admin-thumb" />
                  <div className="admin-compact-info">
                    <span className="admin-compact-name">{item.name}</span>
                    <div className="admin-compact-rating">
                      <StarRating rating={item.avg_rating} size={12} showScore={false} />
                      <span className="admin-rating-number">{item.avg_rating}</span>
                      <span className="admin-rating-count">({item.rating_count})</span>
                    </div>
                  </div>
                  <span className="admin-compact-price">{formatCurrency(item.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RECENT ORDERS & REVIEWS GRID */}
      <div className="admin-dash-sections-grid" style={{ marginTop: '1.5rem' }}>
        {/* Recent Orders */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <ShoppingBag size={18} className="icon-cream" />
              <h3>Recent Orders</h3>
            </div>
            <button type="button" className="admin-link-btn" onClick={() => onNavigate('orders')}>
              All Orders
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="admin-empty-compact">
              <ShoppingBag size={24} className="icon-muted" />
              <p>No orders placed yet.</p>
            </div>
          ) : (
            <div className="admin-compact-list">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="admin-compact-item">
                  <div className="admin-compact-info">
                    <span className="admin-compact-name">Order #{ord.id} • {ord.customer_name}</span>
                    <span className="admin-compact-date">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="admin-compact-action">
                    <span className={`admin-order-badge status-${ord.status}`}>{ord.status}</span>
                    <span className="admin-compact-price">{formatCurrency(ord.total_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Customer Reviews */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <Star size={18} className="icon-gold" />
              <h3>Recent Client Reviews</h3>
            </div>
            <button type="button" className="admin-link-btn" onClick={() => onNavigate('reviews')}>
              Moderate
            </button>
          </div>

          {recentReviews.length === 0 ? (
            <div className="admin-empty-compact">
              <Star size={24} className="icon-muted" />
              <p>No client reviews submitted yet.</p>
            </div>
          ) : (
            <div className="admin-compact-list">
              {recentReviews.map((rev) => (
                <div key={rev.id} className="admin-compact-item" style={{ alignItems: 'flex-start' }}>
                  <div className="admin-compact-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="admin-compact-name">{rev.customer_name}</span>
                      <StarRating rating={rev.rating} size={11} showScore={false} />
                    </div>
                    <span className="admin-compact-piece">On: {rev.product_name}</span>
                    {rev.review_text && (
                      <p className="admin-compact-quote">"{rev.review_text}"</p>
                    )}
                  </div>
                  <span className="admin-compact-date">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   2. PRODUCTS MANAGEMENT WITH INTEGRATED SEARCH
   ======================================================== */
function AdminProducts({
  searchQuery,
  onClearSearch,
  onSearchingStateChange,
  editProduct,
  onClearEdit,
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'instock' | 'lowstock'

  // Debounced search fetcher
  const searchTimeoutRef = useRef(null);

  const fetchProducts = useCallback(
    async (search = '') => {
      setLoading(true);
      onSearchingStateChange?.(true);
      try {
        const params = {};
        if (search && search.trim()) {
          params.search = search.trim();
        }
        const [p, c] = await Promise.all([getProducts(params), getCategories()]);
        setProducts(p);
        setCategories(c);
      } catch (err) {
        setMessage(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
        onSearchingStateChange?.(false);
      }
    },
    [onSearchingStateChange]
  );

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 250);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, fetchProducts]);

  useEffect(() => {
    if (editProduct) {
      startEdit(editProduct);
      onClearEdit?.();
    }
  }, [editProduct]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category_id: product.category_id || '',
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || '',
      is_featured: !!product.is_featured,
      occasion_tags: product.occasion_tags || '',
      gender_tag: product.gender_tag || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    try {
      const payload = { ...form, category_id: form.category_id || null };
      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage('Product updated successfully.');
      } else {
        await createProduct(payload);
        setMessage('New product created successfully.');
      }
      cancelEdit();
      fetchProducts(searchQuery);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Permanently delete this product from the database? This action cannot be undone.')) return;
    try {
      await deleteProduct(id);
      setMessage('Product deleted successfully.');
      fetchProducts(searchQuery);
    } catch (err) {
      setMessage(err.message || 'Failed to delete product');
    }
  }

  const filteredProducts = products.filter((p) => {
    if (filter === 'instock') return p.stock > 5;
    if (filter === 'lowstock') return p.stock <= 5;
    return true;
  });

  return (
    <div className="admin-products-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Catalog Management</p>
          <h1 className="admin-page-title">Products ({products.length})</h1>
        </div>
      </div>

      {/* Search notification banner */}
      {searchQuery && (
        <div className="admin-search-status-banner">
          <span>
            Showing results for <strong>"{searchQuery}"</strong> ({products.length} found)
          </span>
          <button type="button" className="admin-clear-link" onClick={onClearSearch}>
            Clear Search
          </button>
        </div>
      )}

      <div className="admin-section">
        {/* ADD / EDIT FORM */}
        <form className="admin-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Product' : 'Add New Jewellery Piece'}</h3>

          <div className="admin-form-row">
            <label>
              Piece Name *
              <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Solitaire Diamond Ring" />
            </label>
            <label>
              Category
              <select name="category_id" value={form.category_id} onChange={handleChange}>
                <option value="">— Select Category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Description
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe stone clarity, metal hallmarks, carat weight..."
            />
          </label>

          <div className="admin-form-row">
            <label>
              Price (₹) *
              <input
                name="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
                placeholder="4999.00"
              />
            </label>
            <label>
              Inventory Stock *
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                required
                placeholder="10"
              />
            </label>
          </div>

          <label>
            Image URL (Unsplash or direct asset)
            <input
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
            />
          </label>

          <div className="admin-form-row">
            <label>
              Occasion Tags (comma-separated, e.g. bridal, gifting, everyday)
              <input
                name="occasion_tags"
                value={form.occasion_tags}
                onChange={handleChange}
                placeholder="e.g. bridal, gifting, everyday"
              />
            </label>
            <label>
              Gender Tag
              <select name="gender_tag" value={form.gender_tag} onChange={handleChange}>
                <option value="">None (Unisex / General)</option>
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="kids">Kids</option>
              </select>
            </label>
          </div>

          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              name="is_featured"
              checked={form.is_featured}
              onChange={handleChange}
            />
            Show in Featured Collections on storefront
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-gold">
              {editingId ? 'Save Changes' : 'Create Piece'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>

          {message && <p className="admin-message">{message}</p>}
        </form>

        {/* PRODUCTS LIST TABLE */}
        <div className="admin-list-card">
          <div className="admin-list-header">
            <h3>Inventory Table</h3>
            <div className="admin-filter-bar">
              <button
                type="button"
                className={`admin-filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({products.length})
              </button>
              <button
                type="button"
                className={`admin-filter-btn ${filter === 'instock' ? 'active' : ''}`}
                onClick={() => setFilter('instock')}
              >
                In Stock ({products.filter((p) => p.stock > 5).length})
              </button>
              <button
                type="button"
                className={`admin-filter-btn ${filter === 'lowstock' ? 'active' : ''}`}
                onClick={() => setFilter('lowstock')}
              >
                Low Stock ({products.filter((p) => p.stock <= 5).length})
              </button>
            </div>
          </div>

          {loading ? (
            <p className="admin-status">Searching & loading products…</p>
          ) : filteredProducts.length === 0 ? (
            <div className="admin-no-results">
              <Search size={32} className="icon-muted" />
              <h4>No products found</h4>
              {searchQuery ? (
                <p>
                  No jewellery matched your search query <strong>"{searchQuery}"</strong>.
                </p>
              ) : (
                <p>No products exist under this filter.</p>
              )}
              {searchQuery && (
                <button type="button" className="btn btn-outline" onClick={onClearSearch}>
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--text-muted)' }}>#{p.id}</td>
                      <td>
                        <img src={p.image_url} alt={p.name} className="admin-table-img" />
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--cream)' }}>{p.name}</div>
                        <span className="admin-name-sub">/{p.slug}</span>
                      </td>
                      <td>
                        <div>{p.category_name || '—'}</div>
                        {p.occasion_tags && (
                          <span className="admin-name-sub" style={{ color: 'var(--gold)' }}>
                            Tags: {p.occasion_tags}
                          </span>
                        )}
                        {p.gender_tag && (
                          <span className="admin-name-sub" style={{ color: 'var(--cream)', textTransform: 'capitalize' }}>
                            Gender: {p.gender_tag}
                          </span>
                        )}
                      </td>
                      <td>{formatCurrency(p.price)}</td>
                      <td>
                        <span className={`admin-stock-badge ${p.stock <= 5 ? 'low-stock' : 'in-stock'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td>
                        {p.avg_rating > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={12} fill="var(--gold)" stroke="none" />
                            <span>{p.avg_rating}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="admin-table-actions">
                        <button type="button" onClick={() => startEdit(p)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-delete-btn"
                          onClick={() => handleDelete(p.id)}
                          title="Delete product"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   3. CATEGORIES VIEW
   ======================================================== */
function AdminCategories({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="admin-status">Loading categories…</p>;

  return (
    <div className="admin-categories-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Taxonomy</p>
          <h1 className="admin-page-title">Categories ({categories.length})</h1>
        </div>
      </div>

      <div className="admin-categories-grid">
        {categories.map((cat) => (
          <div key={cat.id} className="admin-category-card">
            <div className="admin-cat-icon">
              <FolderTree size={22} />
            </div>
            <h3>{cat.name}</h3>
            <p className="admin-cat-slug">slug: <code>{cat.slug}</code></p>
            <button
              type="button"
              className="btn btn-outline admin-cat-btn"
              onClick={() => onSelectCategory(cat.slug)}
            >
              Filter Products in {cat.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================================================
   4. ORDERS VIEW
   ======================================================== */
function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  function loadOrders() {
    setLoading(true);
    getOrders()
      .then(setOrders)
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadOrders, []);

  async function handleStatusChange(id, status) {
    try {
      await updateOrderStatus(id, status);
      setMessage(`Order #${id} updated to ${status}.`);
      loadOrders();
    } catch (err) {
      setMessage(err.message || 'Failed to update order status');
    }
  }

  if (loading) return <p className="admin-status">Loading store orders…</p>;

  return (
    <div className="admin-orders-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Fulfilment</p>
          <h1 className="admin-page-title">Client Orders ({orders.length})</h1>
        </div>
      </div>

      {message && <p className="admin-message" style={{ marginBottom: '1rem' }}>{message}</p>}

      {orders.length === 0 ? (
        <div className="admin-empty-state">
          <ShoppingBag size={32} className="icon-muted" />
          <p><strong>No customer orders found.</strong></p>
          <p>When clients place orders on the storefront, they will appear here with contact and shipping details.</p>
        </div>
      ) : (
        <div className="admin-list-card">
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Shipping City</th>
                  <th>Total Amount</th>
                  <th>Order Status</th>
                  <th>Placed Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>{o.customer_name}</td>
                    <td>{o.phone}</td>
                    <td>{o.city || '—'}</td>
                    <td>{formatCurrency(o.total_amount)}</td>
                    <td>
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`admin-status-select status-${o.status}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================
   5. CUSTOMERS VIEW
   ======================================================== */
function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAdminCustomers()
      .then(setCustomers)
      .catch((err) => setError(err.message || 'Could not load customer accounts'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="admin-status">Loading registered customers…</p>;

  return (
    <div className="admin-customers-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Client Directory</p>
          <h1 className="admin-page-title">Registered Customers ({customers.length})</h1>
        </div>
      </div>

      {error && <p className="admin-message" style={{ color: '#ff9b9b', marginBottom: '1rem' }}>{error}</p>}

      {customers.length === 0 ? (
        <div className="admin-empty-state">
          <Users size={32} className="icon-muted" />
          <p><strong>No customer accounts registered yet.</strong></p>
        </div>
      ) : (
        <div className="admin-list-card">
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Member Since</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td>
                      <span className={`admin-role-badge role-${c.role}`}>
                        {c.role}
                      </span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================
   6. REVIEWS & RATINGS MODERATION
   ======================================================== */
function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  function loadReviews() {
    setLoading(true);
    getAdminReviews()
      .then(setReviews)
      .catch((err) => setMessage(err.message || 'Failed to load reviews'))
      .finally(() => setLoading(false));
  }

  useEffect(loadReviews, []);

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to remove this client review? This cannot be undone.')) return;
    try {
      await deleteAdminReview(id);
      setMessage('Review deleted successfully.');
      loadReviews();
    } catch (err) {
      setMessage(err.message || 'Failed to delete review');
    }
  }

  if (loading) return <p className="admin-status">Loading customer reviews from database…</p>;

  return (
    <div className="admin-reviews-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Reputation & Feedback</p>
          <h1 className="admin-page-title">Client Reviews ({reviews.length})</h1>
        </div>
      </div>

      {message && <p className="admin-message" style={{ marginBottom: '1rem' }}>{message}</p>}

      {reviews.length === 0 ? (
        <div className="admin-empty-state">
          <Star size={32} className="icon-muted" />
          <p><strong>No customer reviews recorded yet.</strong></p>
          <p>When clients leave star ratings and reviews on pieces, they will be listed here for moderation.</p>
        </div>
      ) : (
        <div className="admin-list-card">
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Review Feedback</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/product/${r.product_slug}`} className="admin-prod-link" target="_blank">
                        {r.product_name}
                      </Link>
                    </td>
                    <td>
                      <div><strong>{r.customer_name}</strong></div>
                      <span className="admin-name-sub">{r.customer_email}</span>
                    </td>
                    <td>
                      <StarRating rating={r.rating} size={13} showScore={false} />
                    </td>
                    <td style={{ maxWidth: '320px', fontSize: '0.84rem' }}>
                      {r.review_text || <em style={{ color: 'var(--text-muted)' }}>No written comment</em>}
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="admin-table-actions">
                      <button
                        type="button"
                        className="admin-delete-btn"
                        onClick={() => handleDelete(r.id)}
                        title="Delete review"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================
   7. STORE SETTINGS OVERVIEW
   ======================================================== */
function AdminSettings({ user }) {
  return (
    <div className="admin-settings-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Configuration</p>
          <h1 className="admin-page-title">Store Settings</h1>
        </div>
      </div>

      <div className="admin-settings-cards">
        <div className="admin-card">
          <h3>Store Profile</h3>
          <div className="admin-settings-row">
            <span>Brand Name</span>
            <strong>AURA — Fine Jewellery</strong>
          </div>
          <div className="admin-settings-row">
            <span>Currency</span>
            <strong>INR (₹)</strong>
          </div>
          <div className="admin-settings-row">
            <span>Atelier Location</span>
            <strong>Indore, Madhya Pradesh, India</strong>
          </div>
        </div>

        <div className="admin-card">
          <h3>Current Session &amp; Security</h3>
          <div className="admin-settings-row">
            <span>Active Administrator</span>
            <strong>{user?.name || 'Administrator'}</strong>
          </div>
          <div className="admin-settings-row">
            <span>Admin Email</span>
            <strong>{user?.email || 'admin@aura.com'}</strong>
          </div>
          <div className="admin-settings-row">
            <span>Authentication Type</span>
            <strong>HTTP Session Cookie (No JWT)</strong>
          </div>
          <div className="admin-settings-row">
            <span>Database Connection</span>
            <strong style={{ color: '#81c784' }}>MySQL Connection Pool (Active)</strong>
          </div>
        </div>
      </div>
    </div>
  );
}