import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyOrders } from '../api';
import { formatCurrency } from '../utils/format';
import './MyOrders.css';

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/my-orders' } });
    }
  }, [authLoading, user, navigate]);

  // Load customer orders
  useEffect(() => {
    if (user) {
      setLoading(true);
      setError(null);
      getMyOrders()
        .then((data) => {
          setOrders(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load your orders.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user]);

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function renderStatusBadge(status) {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'confirmed':
        return (
          <span className="myorders-status-badge status-confirmed">
            <CheckCircle size={13} /> Confirmed
          </span>
        );
      case 'processing':
        return (
          <span className="myorders-status-badge status-processing">
            <Clock size={13} /> Processing
          </span>
        );
      case 'shipped':
        return (
          <span className="myorders-status-badge status-shipped">
            <Truck size={13} /> Shipped
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="myorders-status-badge status-out-for-delivery">
            <Truck size={13} /> Out for Delivery
          </span>
        );
      case 'delivered':
        return (
          <span className="myorders-status-badge status-delivered">
            <CheckCircle size={13} /> Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="myorders-status-badge status-cancelled">
            <XCircle size={13} /> Cancelled
          </span>
        );
      case 'refunded':
        return (
          <span className="myorders-status-badge status-refunded">
            <Package size={13} /> Refunded
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="myorders-status-badge status-pending">
            <Clock size={13} /> Pending
          </span>
        );
    }
  }

  if (authLoading || (loading && !orders.length && !error)) {
    return (
      <div className="myorders-page container">
        <div className="myorders-loading-wrap">
          <div className="myorders-spinner" />
          <p className="myorders-loading-text">Loading your order history…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting to /login
  }

  return (
    <div className="myorders-page container">
      {/* Header */}
      <div className="myorders-header">
        <p className="eyebrow">AURA Privilege</p>
        <h1 className="myorders-title">My Orders</h1>
        <p className="myorders-subtitle">
          View your past jewellery acquisitions, delivery updates, and purchase history.
        </p>
      </div>

      {error && (
        <div className="myorders-error-banner" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="myorders-empty-card">
          <div className="myorders-empty-icon-wrap">
            <Package size={36} className="myorders-empty-icon" />
          </div>
          <h2 className="myorders-empty-title">No Orders Placed Yet</h2>
          <p className="myorders-empty-desc">
            You have not placed any orders with this account yet. Discover our latest collections and timeless jewellery creations.
          </p>
          <Link to="/shop" className="btn btn-gold myorders-empty-btn">
            <ShoppingBag size={16} /> Explore Collections
          </Link>
        </div>
      )}

      {/* Orders List */}
      {orders.length > 0 && (
        <div className="myorders-list">
          {orders.map((order) => {
            const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
            return (
              <div key={order.id} className="myorders-card">
                {/* Order Top Bar */}
                <div className="myorders-card-header">
                  <div className="myorders-meta-group">
                    <div className="myorders-meta-block">
                      <span className="myorders-meta-label">Order Placed</span>
                      <span className="myorders-meta-value">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="myorders-meta-block">
                      <span className="myorders-meta-label">Order ID</span>
                      <span className="myorders-meta-value">#AURA-{order.id}</span>
                    </div>
                    <div className="myorders-meta-block">
                      <span className="myorders-meta-label">Total</span>
                      <span className="myorders-meta-value myorders-total-highlight">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>

                  <div className="myorders-status-group">
                    {renderStatusBadge(order.status)}
                  </div>
                </div>

                {/* Order Details Body */}
                <div className="myorders-card-body">
                  {/* Shipping Address */}
                  <div className="myorders-shipping-info">
                    <div className="myorders-section-heading">
                      <MapPin size={14} className="myorders-section-icon" />
                      <span>Delivery Details</span>
                    </div>
                    <p className="myorders-recipient-name">{order.customer_name}</p>
                    <p className="myorders-recipient-address">
                      {order.address}, {order.city} - {order.pincode}
                    </p>
                    <p className="myorders-recipient-phone">
                      <Phone size={12} /> {order.phone}
                    </p>
                  </div>

                  {/* Line Items Table */}
                  <div className="myorders-items-section">
                    <div className="myorders-section-heading">
                      <Package size={14} className="myorders-section-icon" />
                      <span>Items in this Order ({itemCount})</span>
                    </div>

                    <div className="myorders-items-list">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="myorders-item-row">
                          <div className="myorders-item-info">
                            <span className="myorders-item-name">{item.product_name}</span>
                            <span className="myorders-item-qty">Qty: {item.quantity}</span>
                          </div>
                          <div className="myorders-item-pricing">
                            <span className="myorders-item-unit">
                              {formatCurrency(item.price)} each
                            </span>
                            <span className="myorders-item-subtotal">
                              {formatCurrency(Number(item.price) * item.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Footer */}
                <div className="myorders-card-footer">
                  <span className="myorders-shipping-badge">Insured Express Shipping included</span>
                  <Link to="/shop" className="myorders-reorder-link">
                    <span>Explore More Jewellery</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
