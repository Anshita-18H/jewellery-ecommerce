import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import './AdminLogin.css';

export default function AdminLogin() {
  const { adminUser, adminLogin, adminLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  // If already authenticated as admin, redirect directly to dashboard
  useEffect(() => {
    if (!adminLoading && adminUser) {
      const destination = location.state?.from?.pathname || '/admin/dashboard';
      navigate(destination, { replace: true });
    }
  }, [adminUser, adminLoading, navigate, location]);

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    if (!email.trim() || !password) {
      setApiError('Please provide both administrator email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await adminLogin({
        email: email.trim(),
        password,
      });

      setApiSuccess(res.message || 'Administrator authenticated successfully.');
      setTimeout(() => {
        const destination = location.state?.from?.pathname || '/admin/dashboard';
        navigate(destination, { replace: true });
      }, 600);
    } catch (err) {
      setApiError(err.message || 'Unable to authenticate administrator. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-glow" />

      <div className="admin-login-container">
        <div className="admin-login-card">
          {/* Header */}
          <div className="admin-login-header">
            <div className="admin-login-emblem">♦</div>
            <p className="eyebrow">AURA Privilege</p>
            <h1 className="admin-login-title">Admin Management</h1>
            <p className="admin-login-subtitle">
              Secure store administration portal for catalog, inventory, and order fulfillment.
            </p>
          </div>

          {/* Status Alerts */}
          {apiError && (
            <div className="admin-login-alert alert-error" role="alert">
              <AlertCircle size={16} className="alert-icon" />
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className="admin-login-alert alert-success" role="status">
              <CheckCircle2 size={16} className="alert-icon" />
              <span>{apiSuccess}</span>
            </div>
          )}

          {/* Form */}
          <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
            <div className="admin-login-field">
              <label htmlFor="admin-email" className="admin-login-label">
                Administrator Email
              </label>
              <div className="admin-login-input-wrap">
                <Mail size={16} className="admin-login-input-icon" />
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  className="admin-login-input"
                  placeholder="admin@aura.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="admin-login-field">
              <label htmlFor="admin-password" className="admin-login-label">
                Password
              </label>
              <div className="admin-login-input-wrap">
                <Lock size={16} className="admin-login-input-icon" />
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="admin-login-input password-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="admin-login-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-gold admin-login-submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <span className="admin-login-btn-loading">
                  <span className="admin-login-spinner" />
                  Authenticating…
                </span>
              ) : (
                <span className="admin-login-btn-content">
                  Enter Admin Portal
                  <ArrowRight size={15} />
                </span>
              )}
            </button>
          </form>

          {/* Return link */}
          <div className="admin-login-footer">
            <Link to="/" className="admin-return-link">
              ← Return to Storefront
            </Link>
          </div>

          {/* Security assurance badge */}
          <div className="admin-login-security">
            <ShieldCheck size={14} className="security-icon" />
            <span>Encrypted Session • HttpOnly Cookie • Role-Based Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

