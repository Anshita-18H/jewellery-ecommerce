import { useEffect, useState } from 'react';
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getOrders,
  updateOrderStatus,
} from '../api';
import './Admin.css';

const emptyForm = {
  name: '',
  category_id: '',
  description: '',
  price: '',
  stock: '',
  image_url: '',
  is_featured: false,
};

function isItemActive(p) {
  return !(p.is_active === 0 || p.is_active === false || p.is_active === '0');
}

export default function Admin() {
  const [tab, setTab] = useState('products');
  const [hiddenCount, setHiddenCount] = useState(0);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    getProducts({ include_hidden: 'true' })
      .then((all) => {
        const hidden = all.filter((p) => !isItemActive(p)).length;
        setHiddenCount(hidden);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="admin-page container">
      <div className="admin-header">
        <p className="eyebrow">Admin</p>
        <h1 className="admin-title">Manage Store</h1>
        <p className="admin-warning">
          This panel has no login — anyone with this URL can make changes. Don't share the link publicly.
        </p>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
          Products
        </button>
        <button className={tab === 'hidden' ? 'active' : ''} onClick={() => setTab('hidden')}>
          Hidden Items {hiddenCount > 0 && <span className="admin-tab-count">{hiddenCount}</span>}
        </button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          Orders
        </button>
      </div>

      {tab === 'products' && (
        <AdminProducts
          onHiddenCountChange={setHiddenCount}
          editProduct={editProduct}
          onClearEdit={() => setEditProduct(null)}
        />
      )}
      {tab === 'hidden' && (
        <AdminHiddenProducts
          onHiddenCountChange={setHiddenCount}
          onEditProduct={(p) => {
            setEditProduct(p);
            setTab('products');
          }}
        />
      )}
      {tab === 'orders' && <AdminOrders />}
    </div>
  );
}

function AdminProducts({ onHiddenCountChange, editProduct, onClearEdit }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'hidden'

  function loadData() {
    setLoading(true);
    Promise.all([getProducts({ include_hidden: 'true' }), getCategories()])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
        const hidden = p.filter((item) => !isItemActive(item)).length;
        onHiddenCountChange?.(hidden);
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadData, []);

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
        setMessage('Product updated.');
      } else {
        await createProduct(payload);
        setMessage('Product added.');
      }
      cancelEdit();
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hide this product from the storefront? Customers will not see or be able to buy it. You can restore it anytime.')) return;
    try {
      await deleteProduct(id);
      setMessage('Product hidden from storefront. You can view or restore it anytime under Hidden Items.');
      loadData();
    } catch (err) {
      setMessage(err.message || 'Failed to hide product');
    }
  }

  async function handleRestore(id) {
    try {
      await restoreProduct(id);
      setMessage('Product restored to storefront.');
      loadData();
    } catch (err) {
      setMessage(err.message || 'Failed to restore product');
    }
  }

  const activeProducts = products.filter(isItemActive);
  const hiddenProducts = products.filter((p) => !isItemActive(p));

  const filteredProducts =
    filter === 'active'
      ? activeProducts
      : filter === 'hidden'
      ? hiddenProducts
      : products;

  return (
    <div className="admin-section">
      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>

        <div className="admin-form-row">
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Category
            <select name="category_id" value={form.category_id} onChange={handleChange}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Description
          <textarea name="description" rows={3} value={form.description} onChange={handleChange} />
        </label>

        <div className="admin-form-row">
          <label>
            Price (Rs.)
            <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required />
          </label>
          <label>
            Stock
            <input name="stock" type="number" value={form.stock} onChange={handleChange} required />
          </label>
        </div>

        <label>
          Image URL (mock/placeholder for now)
          <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://placehold.co/500x500" />
        </label>

        <label className="admin-checkbox-label">
          <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} />
          Show in Featured Collections on homepage
        </label>

        <div className="admin-form-actions">
          <button type="submit" className="btn btn-gold">{editingId ? 'Save Changes' : 'Add Product'}</button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancel</button>
          )}
        </div>

        {message && <p className="admin-message">{message}</p>}
      </form>

      <div className="admin-list">
        <div className="admin-list-header">
          <h3>Products ({products.length})</h3>
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
              Active ({activeProducts.length})
            </button>
            <button
              type="button"
              className={`admin-filter-btn ${filter === 'hidden' ? 'active' : ''}`}
              onClick={() => setFilter('hidden')}
            >
              Hidden ({hiddenProducts.length})
            </button>
          </div>
        </div>

        {loading ? (
          <p className="admin-status">Loading…</p>
        ) : filteredProducts.length === 0 ? (
          <p className="admin-status">No products match this filter.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const active = isItemActive(p);
                return (
                  <tr key={p.id} className={!active ? 'admin-row-hidden' : ''}>
                    <td><img src={p.image_url} alt={p.name} className="admin-table-img" /></td>
                    <td>
                      <div>{p.name}</div>
                      {!active && <span className="admin-name-sub">Hidden from store</span>}
                    </td>
                    <td>{p.category_name || '—'}</td>
                    <td>{Number(p.price).toLocaleString()}</td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`admin-status-badge ${active ? 'badge-active' : 'badge-hidden'}`}>
                        {active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="admin-table-actions">
                      <button onClick={() => startEdit(p)}>Edit</button>
                      {active ? (
                        <button onClick={() => handleDelete(p.id)} className="admin-delete-btn" title="Hide from store">
                          Delete
                        </button>
                      ) : (
                        <button onClick={() => handleRestore(p.id)} className="admin-restore-btn" title="Restore to store">
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AdminHiddenProducts({ onHiddenCountChange, onEditProduct }) {
  const [hiddenProducts, setHiddenProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  function loadData() {
    setLoading(true);
    getProducts({ include_hidden: 'true' })
      .then((all) => {
        const hidden = all.filter((p) => !isItemActive(p));
        setHiddenProducts(hidden);
        onHiddenCountChange?.(hidden.length);
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadData, []);

  async function handleRestore(id) {
    try {
      await restoreProduct(id);
      setMessage('Product restored to storefront.');
      loadData();
    } catch (err) {
      setMessage(err.message || 'Failed to restore product');
    }
  }

  return (
    <div className="admin-hidden-section">
      <div className="admin-info-banner">
        <strong>Hidden / Deleted Products</strong>
        <p>
          Products listed here are soft-deleted and hidden from your live customer storefront. They are not permanently erased and remain safe in your database. Click <strong>Restore to Store</strong> to make any item visible and purchasable again.
        </p>
      </div>

      {message && <p className="admin-message" style={{ marginBottom: '1rem' }}>{message}</p>}

      {loading ? (
        <p className="admin-status">Loading hidden items…</p>
      ) : hiddenProducts.length === 0 ? (
        <div className="admin-empty-state">
          <p><strong>No hidden or deleted products.</strong></p>
          <p>When you delete an item from the Products list, it will appear here so you can review or restore it at any time.</p>
        </div>
      ) : (
        <div className="admin-list">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hiddenProducts.map((p) => (
                <tr key={p.id}>
                  <td><img src={p.image_url} alt={p.name} className="admin-table-img" /></td>
                  <td>
                    <div>{p.name}</div>
                    <span className="admin-name-sub">Hidden from store</span>
                  </td>
                  <td>{p.category_name || '—'}</td>
                  <td>{Number(p.price).toLocaleString()}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className="admin-status-badge badge-hidden">Hidden</span>
                  </td>
                  <td className="admin-table-actions">
                    <button className="admin-restore-btn" onClick={() => handleRestore(p.id)}>
                      Restore to Store
                    </button>
                    <button onClick={() => onEditProduct(p)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadOrders() {
    setLoading(true);
    getOrders().then(setOrders).finally(() => setLoading(false));
  }

  useEffect(loadOrders, []);

  async function handleStatusChange(id, status) {
    await updateOrderStatus(id, status);
    loadOrders();
  }

  if (loading) return <p className="admin-status">Loading orders…</p>;
  if (orders.length === 0) return <p className="admin-status">No orders yet.</p>;

  return (
    <div className="admin-list">
      <h3>All Orders ({orders.length})</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Total</th>
            <th>Status</th>
            <th>Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td>{o.customer_name}</td>
              <td>{o.phone}</td>
              <td>Rs.{Number(o.total_amount).toLocaleString()}</td>
              <td>
                <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
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
  );
}