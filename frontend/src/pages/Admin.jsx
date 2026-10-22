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
  Eye,
  Mail,
  Phone,
  MapPin,
  Package,
  User,
  Edit2,
  Check,
} from 'lucide-react';
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  restoreProduct,
  getOrders,
  updateOrderStatus,
  getAdminDashboard,
  getAdminReviews,
  deleteAdminReview,
  getAdminCustomers,
  getAdminCustomerDetails,
  updateAdminCustomerPhone,
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
  is_hero_banner: false,
  is_in_gallery: false,
  is_active: true,
  section_cover: '',
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
        const params = { include_hidden: 'true' };
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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState(null);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setIsFormOpen(true);
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
      is_hero_banner: !!product.is_hero_banner,
      is_in_gallery: !!product.is_in_gallery,
      is_active: product.is_active !== 0 && product.is_active !== false,
      section_cover: product.section_cover || '',
      occasion_tags: product.occasion_tags || '',
      gender_tag: product.gender_tag || '',
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isFormOpen) {
        closeForm();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    try {
      const payload = { ...form, category_id: form.category_id || null };
      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage(`Product "${form.name}" updated successfully.`);
      } else {
        await createProduct(payload);
        setMessage(`New product "${form.name}" created successfully.`);
      }
      closeForm();
      fetchProducts(searchQuery);
    } catch (err) {
      setFormError(err.message || 'Failed to save product');
    }
  }

  async function handleToggleActive(product) {
    const isCurrentlyActive = product.is_active !== 0 && product.is_active !== false;
    const newStatus = isCurrentlyActive ? 0 : 1;
    try {
      await updateProductStatus(product.id, newStatus);
      setMessage(newStatus === 1 ? `"${product.name}" is now Active on website.` : `"${product.name}" has been Deactivated (hidden from website, records preserved).`);
      fetchProducts(searchQuery);
    } catch (err) {
      setMessage(err.message || 'Failed to update product status');
    }
  }

  async function handleDelete(product) {
    const isCurrentlyActive = product.is_active !== 0 && product.is_active !== false;
    if (isCurrentlyActive) {
      if (!confirm(`Deactivate "${product.name}"? This soft-deletes the product by hiding it from the website storefront while keeping your database records intact.`)) return;
      try {
        await deleteProduct(product.id);
        setMessage(`"${product.name}" soft-deleted (deactivated). Database record safely preserved.`);
        fetchProducts(searchQuery);
      } catch (err) {
        setMessage(err.message || 'Failed to deactivate product');
      }
    } else {
      if (!confirm(`"${product.name}" is currently deactivated. Would you like to reactivate it on the website?`)) return;
      try {
        await updateProductStatus(product.id, 1);
        setMessage(`"${product.name}" is now Active on the website.`);
        fetchProducts(searchQuery);
      } catch (err) {
        setMessage(err.message || 'Failed to activate product');
      }
    }
  }

  const filteredProducts = products.filter((p) => {
    if (filter === 'instock') return p.stock > 5;
    if (filter === 'lowstock') return p.stock <= 5;
    if (filter === 'active') return p.is_active !== 0 && p.is_active !== false;
    if (filter === 'deactive') return p.is_active === 0 || p.is_active === false;
    return true;
  });

  return (
    <div className="admin-products-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Catalog Management</p>
          <h1 className="admin-page-title">Products ({products.length})</h1>
        </div>
        <button
          type="button"
          className="btn btn-gold admin-add-product-btn"
          onClick={openAddForm}
        >
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Action / Success Message Banner */}
      {message && (
        <div className="admin-status-message-banner">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

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

      {/* MAIN PRODUCTS CONTENT (FULL WIDTH) */}
      <div className="admin-products-layout">
        {/* ADD / EDIT PRODUCT MODAL */}
        {isFormOpen && (
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeForm();
            }}
          >
            <div className="admin-modal-card">
              <div className="admin-modal-header">
                <h3>{editingId ? 'Edit Product' : 'Add New Jewellery Piece'}</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={closeForm}
                  aria-label="Close form"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="admin-modal-body">
                  {formError && <p className="admin-message error">{formError}</p>}

                  <div className="admin-form-row">
                    <label>
                      Piece Name *
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Solitaire Diamond Ring"
                      />
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

                  <div className="admin-form-row">
                    <label>
                      Section Main Cover Card (Homepage)
                      <select
                        name="section_cover"
                        value={form.section_cover || ''}
                        onChange={handleChange}
                      >
                        <option value="">None (Regular Product)</option>
                        <optgroup label="Shop by Gender Section Cards">
                          <option value="women">Women Jewellery — Main Card Cover</option>
                          <option value="men">Men Jewellery — Main Card Cover</option>
                          <option value="kids">Kids Jewellery — Main Card Cover</option>
                        </optgroup>
                        <optgroup label="Shop by Occasion Section Cards">
                          <option value="bridal">Bridal Edit — Main Card Cover</option>
                          <option value="gifting">Gifting Jewellery — Main Card Cover</option>
                          <option value="everyday">Everyday Wear — Main Card Cover</option>
                        </optgroup>
                      </select>
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      margin: '0.5rem 0',
                    }}
                  >
                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        name="is_hero_banner"
                        checked={form.is_hero_banner}
                        onChange={handleChange}
                      />
                      Show on Homepage Hero Banner (Top main carousel slide)
                    </label>

                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        name="is_in_gallery"
                        checked={form.is_in_gallery}
                        onChange={handleChange}
                      />
                      Show in Luxury Gallery (Lookbook gallery grid)
                    </label>

                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={form.is_featured}
                        onChange={handleChange}
                      />
                      Show in Featured Collections on storefront (4-card showcase grid)
                    </label>

                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                      />
                      Active on Storefront (Uncheck to deactivate / hide piece from customers)
                    </label>
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button type="button" className="btn btn-outline" onClick={closeForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-gold">
                    {editingId ? 'Save Changes' : 'Create Piece'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                className={`admin-filter-btn ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active ({products.filter((p) => p.is_active !== 0 && p.is_active !== false).length})
              </button>
              <button
                type="button"
                className={`admin-filter-btn ${filter === 'deactive' ? 'active' : ''}`}
                onClick={() => setFilter('deactive')}
              >
                Deactive ({products.filter((p) => p.is_active === 0 || p.is_active === false).length})
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {p.is_active === 0 || p.is_active === false ? (
                            <span className="admin-stock-badge deactive" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                              Deactivated
                            </span>
                          ) : (
                            <span className="admin-stock-badge active-status" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                              Active
                            </span>
                          )}
                          {Boolean(p.is_hero_banner) && (
                            <span className="admin-stock-badge" style={{ background: 'rgba(212, 175, 55, 0.25)', color: 'var(--gold)', border: '1px solid var(--gold)', fontSize: '0.68rem', padding: '2px 6px' }}>
                              ★ Hero Banner
                            </span>
                          )}
                          {Boolean(p.is_in_gallery) && (
                            <span className="admin-stock-badge" style={{ background: 'rgba(186, 104, 200, 0.25)', color: '#ce93d8', border: '1px solid #ce93d8', fontSize: '0.68rem', padding: '2px 6px' }}>
                              ✦ Gallery
                            </span>
                          )}
                          {p.section_cover && (
                            <span className="admin-stock-badge" style={{ background: 'rgba(129, 199, 132, 0.25)', color: '#81c784', border: '1px solid #81c784', fontSize: '0.68rem', padding: '2px 6px', textTransform: 'capitalize' }}>
                              Cover: {p.section_cover}
                            </span>
                          )}
                          {Boolean(p.is_featured) && (
                            <span className="admin-stock-badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontSize: '0.68rem', padding: '2px 6px' }}>
                              Featured
                            </span>
                          )}
                        </div>
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
                        {p.is_active === 0 || p.is_active === false ? (
                          <button
                            type="button"
                            className="admin-active-btn"
                            onClick={() => handleToggleActive(p)}
                            title="Activate piece on website"
                          >
                            Active
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-deactive-btn"
                            onClick={() => handleToggleActive(p)}
                            title="Deactivate piece (hide from website without deleting from database)"
                          >
                            Deactive
                          </button>
                        )}
                        <button
                          type="button"
                          className="admin-delete-btn"
                          onClick={() => handleDelete(p)}
                          title="Soft delete (deactivate) product"
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

  // Selected customer for dossier modal
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

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

  function openCustomerDetails(idOrEmail) {
    if (!idOrEmail) return;
    setSelectedCustomerId(idOrEmail);
    setSelectedCustomerData(null);
    setLoadingDetails(true);
    setDetailsError(null);

    getAdminCustomerDetails(idOrEmail)
      .then((data) => setSelectedCustomerData(data))
      .catch((err) => setDetailsError(err.message || 'Failed to load customer profile'))
      .finally(() => setLoadingDetails(false));
  }

  function closeCustomerDetails() {
    setSelectedCustomerId(null);
    setSelectedCustomerData(null);
    setDetailsError(null);
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
                  <th>Customer (Click for Dossier)</th>
                  <th>Delivery Phone</th>
                  <th>Shipping City</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Order Status</th>
                  <th>Placed Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>
                      <button
                        type="button"
                        className="admin-customer-link-btn"
                        onClick={() => openCustomerDetails(o.user_id || o.customer_email)}
                        title="Click to view customer dossier, profile and all order history"
                      >
                        <strong>{o.customer_name}</strong>
                      </button>
                      {o.customer_email && (
                        <div style={{ marginTop: '2px' }}>
                          <button
                            type="button"
                            className="admin-customer-link-btn email-link"
                            onClick={() => openCustomerDetails(o.user_id || o.customer_email)}
                            title="Click to view customer dossier"
                          >
                            {o.customer_email}
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Phone size={12} className="icon-gold" />
                        {o.phone || '—'}
                      </span>
                    </td>
                    <td>{o.city || '—'}</td>
                    <td>{formatCurrency(o.total_amount)}</td>
                    <td>
                      {o.payment_status === 'paid' ? (
                        <div>
                          <span className="admin-stock-badge active-status" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                            Paid ({o.payment_method || 'Razorpay'})
                          </span>
                          {o.razorpay_payment_id && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                              {o.razorpay_payment_id}
                            </div>
                          )}
                        </div>
                      ) : o.payment_status === 'failed' ? (
                        <span className="admin-stock-badge deactive" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                          Failed
                        </span>
                      ) : (
                        <span className="admin-stock-badge" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                          Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`admin-status-select status-${o.status}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => openCustomerDetails(o.user_id || o.customer_email)}
                        title="Open customer information dossier"
                      >
                        <Eye size={13} /> Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Information & Orders Modal */}
      {selectedCustomerId !== null && (
        <AdminCustomerModal
          customerId={selectedCustomerId}
          customerData={selectedCustomerData}
          loading={loadingDetails}
          error={detailsError}
          onClose={closeCustomerDetails}
          onCustomerUpdated={(id, newPhone) => {
            if (selectedCustomerData?.customer) {
              setSelectedCustomerData((prev) => ({
                ...prev,
                customer: {
                  ...prev.customer,
                  phone: newPhone,
                  permanent_phone: newPhone,
                },
              }));
            }
          }}
        />
      )}
    </div>
  );
}

/* ========================================================
   5. CUSTOMERS VIEW & DOSSIER MODAL
   ======================================================== */
function AdminCustomerModal({ customerId, customerData, loading, error, onClose, onCustomerUpdated }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const customer = customerData?.customer;
  const stats = customerData?.stats;
  const orders = customerData?.orders || [];
  const latestAddress = customerData?.latest_shipping_address;

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState(null);

  useEffect(() => {
    if (customer) {
      setPhoneInput(customer.permanent_phone || customer.phone || '');
      setIsEditingPhone(false);
      setPhoneMessage(null);
    }
  }, [customer]);

  async function handleSavePhone(e) {
    e.preventDefault();
    if (!customer?.id) return;
    setSavingPhone(true);
    setPhoneMessage(null);
    try {
      await updateAdminCustomerPhone(customer.id, phoneInput.trim());
      setPhoneMessage({ type: 'success', text: 'Permanent contact number saved successfully.' });
      setIsEditingPhone(false);
      if (onCustomerUpdated) {
        onCustomerUpdated(customer.id, phoneInput.trim());
      }
    } catch (err) {
      setPhoneMessage({ type: 'error', text: err.message || 'Failed to update permanent phone' });
    } finally {
      setSavingPhone(false);
    }
  }

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal-card admin-customer-modal-card">
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div className="admin-customer-modal-title-wrap">
            <div className="admin-customer-avatar">
              {customer?.name ? customer.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <p className="eyebrow">Customer Dossier</p>
              <h3>{customer ? customer.name : `Customer #${customerId}`}</h3>
            </div>
          </div>
          <button
            type="button"
            className="admin-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-modal-body admin-customer-modal-body">
          {loading && (
            <div className="admin-customer-loading">
              <span className="admin-spinner" />
              <p>Fetching full customer profile and order history…</p>
            </div>
          )}

          {error && (
            <div className="admin-message error" style={{ margin: '1rem 0' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!loading && customer && (
            <>
              {/* Top Overview Cards Grid */}
              <div className="admin-customer-grid">
                {/* Contact Card */}
                <div className="admin-customer-card">
                  <div className="admin-customer-card-header">
                    <User size={16} className="icon-gold" />
                    <h4>Client Profile</h4>
                    <span className={`admin-role-badge role-${customer.role}`}>
                      {customer.role}
                    </span>
                  </div>
                  <div className="admin-customer-card-content">
                    <div className="admin-info-item">
                      <span className="admin-info-label">Full Name</span>
                      <strong className="admin-info-value">{customer.name}</strong>
                    </div>
                    <div className="admin-info-item">
                      <span className="admin-info-label">Email Address</span>
                      <a href={`mailto:${customer.email}`} className="admin-info-value admin-link-gold">
                        <Mail size={13} />
                        {customer.email}
                      </a>
                    </div>

                    {/* Permanent Account Contact */}
                    <div className="admin-info-item">
                      <div className="admin-info-label-row">
                        <span className="admin-info-label">Permanent Account Contact</span>
                        <span className="admin-phone-permanent-tag">Permanent</span>
                      </div>
                      {isEditingPhone ? (
                        <form onSubmit={handleSavePhone} className="admin-inline-phone-edit-form">
                          <input
                            type="tel"
                            className="admin-inline-phone-input"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="e.g. +91 98765 43210"
                            autoFocus
                          />
                          <button type="submit" className="admin-mini-btn-save" disabled={savingPhone}>
                            <Check size={12} /> {savingPhone ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className="admin-mini-btn-cancel"
                            onClick={() => {
                              setIsEditingPhone(false);
                              setPhoneInput(customer.permanent_phone || customer.phone || '');
                            }}
                          >
                            <X size={12} />
                          </button>
                        </form>
                      ) : (
                        <div className="admin-phone-display-row">
                          <span className="admin-info-value">
                            {customer.permanent_phone || customer.phone ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Phone size={13} className="icon-gold" />
                                <strong>{customer.permanent_phone || customer.phone}</strong>
                              </span>
                            ) : (
                              <span className="text-muted">Not specified on account</span>
                            )}
                          </span>
                          {customer.id && (
                            <button
                              type="button"
                              className="admin-phone-edit-btn"
                              onClick={() => setIsEditingPhone(true)}
                              title="Update permanent contact number"
                            >
                              <Edit2 size={11} /> Edit
                            </button>
                          )}
                        </div>
                      )}
                      {phoneMessage && (
                        <span className={`admin-inline-msg ${phoneMessage.type}`}>
                          {phoneMessage.text}
                        </span>
                      )}
                      <span className="admin-info-subtext">
                        Customer permanent contact number recorded on account profile.
                      </span>
                    </div>

                    {/* Delivery Contact (Per Order) */}
                    <div className="admin-info-item">
                      <div className="admin-info-label-row">
                        <span className="admin-info-label">Delivery Contact</span>
                        <span className="admin-phone-delivery-tag">Per-Order Delivery</span>
                      </div>
                      <span className="admin-info-value">
                        {customer.delivery_phone ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={13} style={{ color: '#64b5f6' }} />
                            <span>{customer.delivery_phone}</span>
                          </span>
                        ) : (
                          <span className="text-muted">No delivery orders yet</span>
                        )}
                      </span>
                      <span className="admin-info-subtext">
                        Provided during order checkout; can be changed with each order delivery.
                      </span>
                    </div>

                    <div className="admin-info-item">
                      <span className="admin-info-label">Account Sign-in Type</span>
                      <span className="admin-info-value">{customer.auth_type}</span>
                    </div>
                    <div className="admin-info-item">
                      <span className="admin-info-label">Member Since</span>
                      <span className="admin-info-value">
                        {new Date(customer.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purchase Stats Card */}
                <div className="admin-customer-card">
                  <div className="admin-customer-card-header">
                    <ShoppingBag size={16} className="icon-gold" />
                    <h4>Purchase Activity</h4>
                  </div>
                  <div className="admin-customer-card-content">
                    <div className="admin-stat-highlight">
                      <div className="admin-stat-number">{stats?.total_orders || 0}</div>
                      <div className="admin-stat-desc">Lifetime Orders</div>
                    </div>
                    <div className="admin-info-item" style={{ marginTop: '0.75rem' }}>
                      <span className="admin-info-label">Total Spent</span>
                      <strong className="admin-info-value gold-amount">
                        {formatCurrency(stats?.total_spent || 0)}
                      </strong>
                    </div>
                    <div className="admin-info-item">
                      <span className="admin-info-label">Average Order Value</span>
                      <span className="admin-info-value">
                        {stats?.total_orders > 0
                          ? formatCurrency(stats.total_spent / stats.total_orders)
                          : '₹0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Destination Card */}
                <div className="admin-customer-card">
                  <div className="admin-customer-card-header">
                    <MapPin size={16} className="icon-gold" />
                    <h4>Delivery Address</h4>
                  </div>
                  <div className="admin-customer-card-content">
                    {latestAddress ? (
                      <div className="admin-address-box">
                        <div className="admin-address-name">{latestAddress.recipient_name}</div>
                        <div className="admin-address-line">{latestAddress.address}</div>
                        <div className="admin-address-line">
                          {latestAddress.city} — {latestAddress.pincode}
                        </div>
                        {latestAddress.phone && (
                          <div className="admin-address-phone">
                            <Phone size={12} /> {latestAddress.phone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted" style={{ fontSize: '0.82rem', margin: '0.5rem 0' }}>
                        No shipping address recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order History Section */}
              <div className="admin-customer-orders-section">
                <div className="admin-customer-section-header">
                  <div>
                    <h4>Order History &amp; Pieces Ordered</h4>
                    <p className="admin-customer-section-sub">
                      Showing all {orders.length} order{orders.length === 1 ? '' : 's'} placed by this customer
                    </p>
                  </div>
                  <span className="admin-order-count-pill">{orders.length} Orders</span>
                </div>

                {orders.length === 0 ? (
                  <div className="admin-empty-state" style={{ padding: '2rem 1rem' }}>
                    <ShoppingBag size={28} className="icon-muted" />
                    <p><strong>No orders placed yet.</strong></p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      When this client purchases items from AURA, their orders and pieces will be detailed here.
                    </p>
                  </div>
                ) : (
                  <div className="admin-customer-orders-list">
                    {orders.map((o) => (
                      <div key={o.id} className="admin-customer-order-card">
                        <div className="admin-customer-order-top">
                          <div className="admin-customer-order-id-wrap">
                            <span className="admin-order-tag">Order #{o.id}</span>
                            <span className="admin-order-date">
                              {new Date(o.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="admin-customer-order-badges">
                            {/* Payment Status */}
                            <span
                              className={`admin-stock-badge ${
                                o.payment_status === 'paid' ? 'active-status' : 'pending-status'
                              }`}
                            >
                              {o.payment_status === 'paid' ? 'Paid' : 'Unpaid'} ({o.payment_method || 'Razorpay'})
                            </span>

                            {/* Order Status */}
                            <span className={`admin-order-status-badge status-${o.status}`}>
                              {o.status}
                            </span>

                            {/* Total Amount */}
                            <strong className="admin-order-total-highlight">
                              {formatCurrency(o.total_amount)}
                            </strong>
                          </div>
                        </div>

                        {/* Delivery snapshot for this order */}
                        <div className="admin-customer-order-shipping-bar">
                          <span>
                            <strong>Ship to:</strong> {o.customer_name} • {o.address}, {o.city} ({o.pincode}) • Phone: {o.phone}
                          </span>
                          {o.razorpay_payment_id && (
                            <span className="admin-order-rzp-id">
                              Payment ID: <code>{o.razorpay_payment_id}</code>
                            </span>
                          )}
                        </div>

                        {/* Items Ordered Table */}
                        <div className="admin-order-items-wrap">
                          <h5 className="admin-order-items-title">
                            <Package size={14} className="icon-gold" /> Pieces Ordered ({o.items?.length || 0}):
                          </h5>
                          <div className="admin-order-items-grid">
                            {(o.items || []).map((item, idx) => (
                              <div key={item.id || idx} className="admin-order-item-row">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.product_name}
                                    className="admin-order-item-thumb"
                                  />
                                ) : (
                                  <div className="admin-order-item-thumb-placeholder">♦</div>
                                )}
                                <div className="admin-order-item-details">
                                  <div className="admin-order-item-name">{item.product_name}</div>
                                  <div className="admin-order-item-meta">
                                    <span>Quantity: <strong>{item.quantity}</strong></span>
                                    <span>Price: <strong>{formatCurrency(item.price)}</strong></span>
                                    <span>Subtotal: <strong className="gold-amount">{formatCurrency(item.price * item.quantity)}</strong></span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="admin-modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected customer for full detail modal
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  useEffect(() => {
    getAdminCustomers()
      .then(setCustomers)
      .catch((err) => setError(err.message || 'Could not load customer accounts'))
      .finally(() => setLoading(false));
  }, []);

  function openCustomerDetails(id) {
    setSelectedCustomerId(id);
    setSelectedCustomerData(null);
    setLoadingDetails(true);
    setDetailsError(null);

    getAdminCustomerDetails(id)
      .then((data) => setSelectedCustomerData(data))
      .catch((err) => setDetailsError(err.message || 'Failed to load customer profile'))
      .finally(() => setLoadingDetails(false));
  }

  function closeCustomerDetails() {
    setSelectedCustomerId(null);
    setSelectedCustomerData(null);
    setDetailsError(null);
  }

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.permanent_phone && c.permanent_phone.toLowerCase().includes(q)) ||
      (c.delivery_phone && c.delivery_phone.toLowerCase().includes(q))
    );
  });

  if (loading) return <p className="admin-status">Loading registered customers…</p>;

  return (
    <div className="admin-customers-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Client Directory</p>
          <h1 className="admin-page-title">Registered Customers ({customers.length})</h1>
        </div>
        <div className="admin-search-wrap" style={{ maxWidth: '320px' }}>
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name, email, phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {error && <p className="admin-message" style={{ color: '#ff9b9b', marginBottom: '1rem' }}>{error}</p>}

      {customers.length === 0 ? (
        <div className="admin-empty-state">
          <Users size={32} className="icon-muted" />
          <p><strong>No customer accounts registered yet.</strong></p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="admin-empty-state">
          <Search size={32} className="icon-muted" />
          <p><strong>No clients match &ldquo;{searchQuery}&rdquo;.</strong></p>
          <button type="button" className="btn btn-outline" onClick={() => setSearchQuery('')} style={{ marginTop: '0.75rem' }}>
            Clear Search Filter
          </button>
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
                  <th>Contact Phone</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Role</th>
                  <th>Member Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-customer-link-btn"
                        onClick={() => openCustomerDetails(c.id)}
                        title="Click to view full customer dossier & order history"
                      >
                        <strong>{c.name}</strong>
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-customer-link-btn email-link"
                        onClick={() => openCustomerDetails(c.id)}
                        title="Click to view full customer dossier & order history"
                      >
                        {c.email}
                      </button>
                    </td>
                    <td>
                      {c.permanent_phone ? (
                        <div className="admin-phone-cell">
                          <span className="admin-phone-val">{c.permanent_phone}</span>
                          <span className="admin-phone-tag-tiny permanent">Permanent</span>
                        </div>
                      ) : c.delivery_phone ? (
                        <div className="admin-phone-cell">
                          <span className="admin-phone-val">{c.delivery_phone}</span>
                          <span className="admin-phone-tag-tiny delivery">Delivery</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-order-count-badge ${Number(c.orders_count) > 0 ? 'has-orders' : 'zero-orders'}`}
                        onClick={() => openCustomerDetails(c.id)}
                        style={{ border: 'none', cursor: 'pointer' }}
                        title="Click to view orders"
                      >
                        {c.orders_count || 0} {Number(c.orders_count) === 1 ? 'order' : 'orders'}
                      </button>
                    </td>
                    <td>
                      <strong style={{ color: Number(c.total_spent) > 0 ? 'var(--gold-bright)' : 'var(--text-muted)' }}>
                        {formatCurrency(c.total_spent || 0)}
                      </strong>
                    </td>
                    <td>
                      <span className={`admin-role-badge role-${c.role}`}>
                        {c.role}
                      </span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => openCustomerDetails(c.id)}
                        title="View complete customer information and order details"
                      >
                        <Eye size={13} />
                        <span>View Info</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Information & Orders Modal */}
      {selectedCustomerId !== null && (
        <AdminCustomerModal
          customerId={selectedCustomerId}
          customerData={selectedCustomerData}
          loading={loadingDetails}
          error={detailsError}
          onClose={closeCustomerDetails}
          onCustomerUpdated={(id, newPhone) => {
            setCustomers((prev) =>
              prev.map((c) => (c.id === id ? { ...c, phone: newPhone, permanent_phone: newPhone } : c))
            );
            if (selectedCustomerData?.customer) {
              setSelectedCustomerData((prev) => ({
                ...prev,
                customer: {
                  ...prev.customer,
                  phone: newPhone,
                  permanent_phone: newPhone,
                },
              }));
            }
          }}
        />
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