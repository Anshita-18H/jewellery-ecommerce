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
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  restoreProduct,
  hardDeleteProduct,
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
  const [categoryFilter, setCategoryFilter] = useState('');
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

            {/* BREADCRUMB INDICATOR */}
            <div className="admin-topbar-breadcrumb">
              <span className="admin-breadcrumb-brand">AURA</span>
              <span className="admin-breadcrumb-sep">/</span>
              <span className="admin-breadcrumb-section">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'products' && 'Product Inventory'}
                {activeTab === 'categories' && 'Taxonomy & Categories'}
                {activeTab === 'orders' && 'Client Orders'}
                {activeTab === 'customers' && 'Customer Directory'}
                {activeTab === 'reviews' && 'Reviews & Moderation'}
                {activeTab === 'settings' && 'Store Configuration'}
              </span>
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
              initialCategory={categoryFilter}
              onClearInitialCategory={() => setCategoryFilter('')}
              editProduct={editProduct}
              onClearEdit={() => setEditProduct(null)}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategories onSelectCategory={(catSlug) => {
              setCategoryFilter(catSlug);
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
  initialCategory,
  onClearInitialCategory,
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
  const [searchQuery, setSearchQuery] = useState(initialCategory || '');

  // Keep search query updated if initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setSearchQuery(initialCategory);
    }
  }, [initialCategory]);

  // Debounced search fetcher
  const searchTimeoutRef = useRef(null);

  const fetchProducts = useCallback(
    async (search = '') => {
      setLoading(true);
      try {
        const params = { include_hidden: 'true', include_deleted: 'true' };
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
      }
    },
    []
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
      setMessage(newStatus === 1 ? `"${product.name}" is now Active on storefront.` : `"${product.name}" has been Deactivated (hidden from website).`);
      fetchProducts(searchQuery);
    } catch (err) {
      setMessage(err.message || 'Failed to update product status');
    }
  }

  async function handleDelete(product) {
    if (!confirm(`Move "${product.name}" to Deleted Items? It will be removed from your active inventory table and can be restored anytime.`)) return;
    try {
      await deleteProduct(product.id);
      setMessage(`"${product.name}" soft-deleted (moved to Deleted Items).`);
      fetchProducts(searchQuery);
    } catch (err) {
      setMessage(err.message || 'Failed to delete product');
    }
  }

  async function handleRestore(product) {
    try {
      await restoreProduct(product.id);
      setMessage(`"${product.name}" restored successfully back to active inventory.`);
      fetchProducts(searchQuery);
    } catch (err) {
      setMessage(err.message || 'Failed to restore product');
    }
  }

  async function handleHardDelete(product) {
    if (!confirm(`Permanently delete "${product.name}" from database? This action is irreversible.`)) return;
    try {
      await hardDeleteProduct(product.id);
      setMessage(`"${product.name}" permanently deleted from database.`);
      fetchProducts(searchQuery);
    } catch (err) {
      setMessage(err.message || 'Failed to permanently delete product');
    }
  }

  const nonDeletedProducts = products.filter((p) => p.is_deleted !== 1 && p.is_deleted !== true);
  const deletedProducts = products.filter((p) => p.is_deleted === 1 || p.is_deleted === true);
  const activeProducts = nonDeletedProducts.filter((p) => p.is_active !== 0 && p.is_active !== false);
  const deactiveProducts = nonDeletedProducts.filter((p) => p.is_active === 0 || p.is_active === false);
  const inStockProducts = nonDeletedProducts.filter((p) => Number(p.stock) > 5);
  const lowStockProducts = nonDeletedProducts.filter((p) => Number(p.stock) <= 5);

  const filteredProducts = products.filter((p) => {
    const isDeleted = p.is_deleted === 1 || p.is_deleted === true;
    if (filter === 'deleted') {
      return isDeleted;
    }
    // All other filters completely exclude soft-deleted products so they are removed from the active table!
    if (isDeleted) return false;

    if (filter === 'active') return p.is_active !== 0 && p.is_active !== false;
    if (filter === 'deactive') return p.is_active === 0 || p.is_active === false;
    if (filter === 'instock') return Number(p.stock) > 5;
    if (filter === 'lowstock') return Number(p.stock) <= 5;
    return true; // 'all'
  });

  return (
    <div className="admin-products-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Catalog Management</p>
          <h1 className="admin-page-title">Products ({filter === 'deleted' ? deletedProducts.length : nonDeletedProducts.length})</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div className="admin-search-wrap" style={{ minWidth: '240px', maxWidth: '340px' }}>
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search products by name, ID, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => {
                  setSearchQuery('');
                  onClearInitialCategory?.();
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
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
            Showing results for <strong>"{searchQuery}"</strong> ({filteredProducts.length} found)
          </span>
          <button
            type="button"
            className="admin-clear-link"
            onClick={() => {
              setSearchQuery('');
              onClearInitialCategory?.();
            }}
          >
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
            <div>
              <h3>{filter === 'deleted' ? 'Deleted Items' : 'Inventory Table'}</h3>
              <p className="admin-list-sub">
                {filter === 'deleted'
                  ? 'Soft-deleted items removed from the live store catalog. You can restore them or permanently delete them.'
                  : 'Manage pricing, real-time stock levels, storefront visibility, and categories.'}
              </p>
            </div>
            <div className="admin-filter-bar">
              <button
                type="button"
                className={`admin-filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({nonDeletedProducts.length})
              </button>
              <button
                type="button"
                className={`admin-filter-btn ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active ({activeProducts.length})
              </button>
              <button
                type="button"
                className={`admin-filter-btn ${filter === 'deactive' ? 'active' : ''}`}
                onClick={() => setFilter('deactive')}
              >
                Deactive ({deactiveProducts.length})
              </button>
              <button
                type="button"
                className={`admin-filter-btn ${filter === 'instock' ? 'active' : ''}`}
                onClick={() => setFilter('instock')}
              >
                In Stock ({inStockProducts.length})
              </button>
              <button
                type="button"
                className={`admin-filter-btn ${filter === 'lowstock' ? 'active' : ''}`}
                onClick={() => setFilter('lowstock')}
              >
                Low Stock ({lowStockProducts.length})
              </button>
              <button
                type="button"
                className={`admin-filter-btn admin-filter-btn-deleted ${filter === 'deleted' ? 'active' : ''}`}
                onClick={() => setFilter('deleted')}
                title="View soft-deleted products"
              >
                <Trash2 size={13} />
                <span>Deleted ({deletedProducts.length})</span>
              </button>
            </div>
          </div>

          {loading ? (
            <p className="admin-status">Searching & loading products…</p>
          ) : filteredProducts.length === 0 ? (
            <div className="admin-no-results">
              <Search size={32} className="icon-muted" />
              <h4>{filter === 'deleted' ? 'No Deleted Items' : 'No products found'}</h4>
              {filter === 'deleted' ? (
                <p>When you delete products from your inventory, they are safely preserved here and can be restored anytime.</p>
              ) : searchQuery ? (
                <p>
                  No jewellery matched your search query <strong>"{searchQuery}"</strong>.
                </p>
              ) : (
                <p>No products exist under this filter.</p>
              )}
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setSearchQuery('');
                    onClearInitialCategory?.();
                  }}
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '56px' }}>ID</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th style={{ minWidth: '130px' }}>Status</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Price</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Stock</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Rating</th>
                    <th style={{ textAlign: 'right', minWidth: '190px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isDeleted = p.is_deleted === 1 || p.is_deleted === true;
                    const isActive = p.is_active !== 0 && p.is_active !== false;

                    return (
                      <tr key={p.id} className={isDeleted ? 'row-deleted' : ''}>
                        <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>
                          #{p.id}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <img src={p.image_url || '/placeholder.jpg'} alt={p.name} className="admin-table-img" />
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--cream)', fontSize: '0.86rem' }}>{p.name}</div>
                          <span className="admin-name-sub">/{p.slug}</span>
                        </td>
                        <td>
                          <div style={{ color: 'var(--cream)', fontWeight: 500 }}>{p.category_name || '—'}</div>
                          {p.occasion_tags && (
                            <span className="admin-name-sub" style={{ color: 'var(--gold-dim)' }}>
                              Tags: {p.occasion_tags}
                            </span>
                          )}
                          {p.gender_tag && (
                            <span className="admin-name-sub" style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                              Gender: {p.gender_tag}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            {isDeleted ? (
                              <span className="admin-status-pill status-deleted">
                                <span className="admin-status-dot" /> Deleted
                              </span>
                            ) : !isActive ? (
                              <span className="admin-status-pill status-deactive">
                                <span className="admin-status-dot" /> Deactivated
                              </span>
                            ) : (
                              <span className="admin-status-pill status-active">
                                <span className="admin-status-dot" /> Active
                              </span>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                              {Boolean(p.is_hero_banner) && (
                                <span className="admin-mini-tag hero-tag">★ Hero</span>
                              )}
                              {Boolean(p.is_in_gallery) && (
                                <span className="admin-mini-tag gallery-tag">✦ Gallery</span>
                              )}
                              {Boolean(p.is_featured) && (
                                <span className="admin-mini-tag featured-tag">Featured</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <strong style={{ color: 'var(--gold-bright)', fontSize: '0.88rem' }}>
                            {formatCurrency(p.price)}
                          </strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`admin-stock-badge ${Number(p.stock) <= 5 ? 'low-stock' : 'in-stock'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {p.avg_rating > 0 ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Star size={11} fill="var(--gold)" stroke="none" />
                              <span style={{ fontWeight: 500, color: 'var(--cream)', fontSize: '0.8rem' }}>{p.avg_rating}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td className="admin-table-actions" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', width: '100%' }}>
                            {isDeleted ? (
                              <>
                                <button
                                  type="button"
                                  className="admin-restore-btn"
                                  onClick={() => handleRestore(p)}
                                  title="Restore piece back to live inventory"
                                >
                                  <RotateCcw size={12} />
                                  <span>Restore</span>
                                </button>
                                <button
                                  type="button"
                                  className="admin-delete-permanent-btn"
                                  onClick={() => handleHardDelete(p)}
                                  title="Permanently remove from database"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete Forever</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="admin-edit-btn"
                                  onClick={() => startEdit(p)}
                                  title="Edit piece details"
                                >
                                  Edit
                                </button>
                                {!isActive ? (
                                  <button
                                    type="button"
                                    className="admin-active-btn"
                                    onClick={() => handleToggleActive(p)}
                                    title="Activate piece on website storefront"
                                  >
                                    Active
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="admin-deactive-btn"
                                    onClick={() => handleToggleActive(p)}
                                    title="Deactivate piece (hide from storefront)"
                                  >
                                    Deactive
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="admin-delete-btn"
                                  onClick={() => handleDelete(p)}
                                  title="Move piece to Deleted Items"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      getCategories().catch(() => []),
      getProducts({ include_hidden: 'true' }).catch(() => [])
    ])
      .then(([cats, prods]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        setProducts(Array.isArray(prods) ? prods : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (cat.name && cat.name.toLowerCase().includes(q)) ||
      (cat.slug && cat.slug.toLowerCase().includes(q))
    );
  });

  if (loading) return <p className="admin-status">Loading categories and stock levels…</p>;

  return (
    <div className="admin-categories-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Taxonomy</p>
          <h1 className="admin-page-title">Categories ({filteredCategories.length})</h1>
        </div>
        <div className="admin-search-wrap" style={{ maxWidth: '320px' }}>
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search categories..."
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

      {filteredCategories.length === 0 ? (
        <div className="admin-empty-state">
          <Search size={32} className="icon-muted" />
          <p><strong>No categories match &ldquo;{searchQuery}&rdquo;.</strong></p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setSearchQuery('')}
            style={{ marginTop: '0.75rem' }}
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
      <div className="admin-categories-grid">
        {categories.map((cat) => {
          const catProducts = products.filter(
            (p) =>
              p.category_id === cat.id ||
              (p.category_slug && p.category_slug.toLowerCase() === (cat.slug || '').toLowerCase())
          );
          const computedStock = catProducts.reduce((sum, p) => sum + Number(p.stock || 0), 0);
          const totalStock =
            cat.total_stock !== undefined && cat.total_stock !== null
              ? Number(cat.total_stock)
              : computedStock;
          const productCount =
            cat.product_count !== undefined && cat.product_count !== null
              ? Number(cat.product_count)
              : catProducts.length;

          return (
            <div
              key={cat.id}
              className="admin-category-card"
              onClick={() => onSelectCategory(cat.slug)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectCategory(cat.slug);
                }
              }}
              title={`Click to open ${cat.name} category (${totalStock} in stock)`}
            >
              <div className="admin-cat-icon">
                <FolderTree size={22} />
              </div>
              <h3>{cat.name}</h3>
              <p className="admin-cat-slug">
                slug: <code>{cat.slug}</code>
              </p>

              <div className="admin-cat-meta-row">
                <span className="admin-cat-count">
                  {productCount} {productCount === 1 ? 'Design' : 'Designs'}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-outline admin-cat-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCategory(cat.slug);
                }}
                title={`Open ${cat.name} (${totalStock} in stock)`}
              >
                <Package size={14} className="icon-gold" />
                <span>{totalStock} in Stock</span>
                <ArrowRight size={13} className="admin-cat-arrow" />
              </button>
            </div>
          );
        })}
      </div>
      )}
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const idStr = String(o.id || '');
    const name = (o.customer_name || '').toLowerCase();
    const email = (o.customer_email || '').toLowerCase();
    const phone = (o.phone || '').toLowerCase();
    const city = (o.city || '').toLowerCase();
    const status = (o.status || '').toLowerCase();
    const paymentStatus = (o.payment_status || '').toLowerCase();
    const rzpId = (o.razorpay_payment_id || '').toLowerCase();

    return (
      idStr.includes(q) ||
      name.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      city.includes(q) ||
      status.includes(q) ||
      paymentStatus.includes(q) ||
      rzpId.includes(q)
    );
  });

  if (loading) return <p className="admin-status">Loading store orders…</p>;

  return (
    <div className="admin-orders-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Fulfilment</p>
          <h1 className="admin-page-title">Client Orders ({filteredOrders.length})</h1>
        </div>
        <div className="admin-search-wrap" style={{ maxWidth: '340px' }}>
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by order #, name, email, phone, city..."
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

      {message && <p className="admin-message" style={{ marginBottom: '1rem' }}>{message}</p>}

      {orders.length === 0 ? (
        <div className="admin-empty-state">
          <ShoppingBag size={32} className="icon-muted" />
          <p><strong>No customer orders found.</strong></p>
          <p>When clients place orders on the storefront, they will appear here with contact and shipping details.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-empty-state">
          <Search size={32} className="icon-muted" />
          <p><strong>No orders match &ldquo;{searchQuery}&rdquo;.</strong></p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setSearchQuery('')}
            style={{ marginTop: '0.75rem' }}
          >
            Clear Search Filter
          </button>
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
                {filteredOrders.map((o) => (
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
      setPhoneInput(customer.phone || customer.permanent_phone || customer.delivery_phone || '');
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
      setPhoneMessage({ type: 'success', text: 'Contact number saved.' });
      setIsEditingPhone(false);
      customer.phone = phoneInput.trim();
      customer.permanent_phone = phoneInput.trim();
      if (onCustomerUpdated) {
        onCustomerUpdated(customer.id, phoneInput.trim());
      }
    } catch (err) {
      setPhoneMessage({ type: 'error', text: err.message || 'Failed to update phone' });
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

                    {/* Contact Number */}
                    <div className="admin-info-item">
                      <span className="admin-info-label">Contact Number</span>
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
                              setPhoneInput(customer.phone || customer.permanent_phone || customer.delivery_phone || '');
                            }}
                          >
                            <X size={12} />
                          </button>
                        </form>
                      ) : (
                        <div className="admin-phone-display-row">
                          <span className="admin-info-value">
                            {customer.phone || customer.permanent_phone || customer.delivery_phone ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Phone size={13} className="icon-gold" />
                                <strong>{customer.phone || customer.permanent_phone || customer.delivery_phone}</strong>
                              </span>
                            ) : (
                              <span className="text-muted">No phone provided</span>
                            )}
                          </span>
                          {customer.id && (
                            <button
                              type="button"
                              className="admin-phone-edit-btn"
                              onClick={() => setIsEditingPhone(true)}
                              title="Edit contact number"
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
                    <td>{c.phone || c.permanent_phone || c.delivery_phone || '—'}</td>
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const prodName = (r.product_name || '').toLowerCase();
    const custName = (r.customer_name || '').toLowerCase();
    const custEmail = (r.customer_email || '').toLowerCase();
    const text = (r.review_text || '').toLowerCase();
    const ratingStr = String(r.rating || '');

    return (
      prodName.includes(q) ||
      custName.includes(q) ||
      custEmail.includes(q) ||
      text.includes(q) ||
      ratingStr.includes(q)
    );
  });

  if (loading) return <p className="admin-status">Loading customer reviews from database…</p>;

  return (
    <div className="admin-reviews-view">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Reputation & Feedback</p>
          <h1 className="admin-page-title">Client Reviews ({filteredReviews.length})</h1>
        </div>
        <div className="admin-search-wrap" style={{ maxWidth: '320px' }}>
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search reviews by piece, client, comment..."
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

      {message && <p className="admin-message" style={{ marginBottom: '1rem' }}>{message}</p>}

      {reviews.length === 0 ? (
        <div className="admin-empty-state">
          <Star size={32} className="icon-muted" />
          <p><strong>No customer reviews recorded yet.</strong></p>
          <p>When clients leave star ratings and reviews on pieces, they will be listed here for moderation.</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="admin-empty-state">
          <Search size={32} className="icon-muted" />
          <p><strong>No reviews match &ldquo;{searchQuery}&rdquo;.</strong></p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setSearchQuery('')}
            style={{ marginTop: '0.75rem' }}
          >
            Clear Search Filter
          </button>
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
                {filteredReviews.map((r) => (
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