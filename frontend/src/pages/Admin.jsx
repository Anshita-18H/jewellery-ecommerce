import { useEffect, useState } from 'react';
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
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

export default function Admin() {
  const [tab, setTab] = useState('products');

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
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          Orders
        </button>
      </div>

      {tab === 'products' ? <AdminProducts /> : <AdminOrders />}
    </div>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  function loadData() {
    setLoading(true);
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadData, []);

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
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await deleteProduct(id);
    loadData();
  }

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
        <h3>All Products ({products.length})</h3>
        {loading ? (
          <p className="admin-status">Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><img src={p.image_url} alt={p.name} className="admin-table-img" /></td>
                  <td>{p.name}</td>
                  <td>{p.category_name || '—'}</td>
                  <td>${Number(p.price).toLocaleString()}</td>
                  <td>{p.stock}</td>
                  <td className="admin-table-actions">
                    <button onClick={() => startEdit(p)}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="admin-delete-btn">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
              <td>${Number(o.total_amount).toLocaleString()}</td>
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