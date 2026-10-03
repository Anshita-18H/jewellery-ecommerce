import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation & UI states
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  // Field validation helpers
  function validateEmail(val) {
    if (!val || !val.trim()) {
      return 'Email address is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  function validatePassword(val) {
    if (!val) {
      return 'Password is required';
    }
    if (val.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  }

  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    // Mark all fields touched on submit
    setTouched({ email: true, password: true });

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      return;
    }

    // Enter loading state
    setLoading(true);

    try {
      const res = await login({
        email: email.trim(),
        password,
        rememberMe,
      });

      setApiSuccess(res.message || 'Signed in successfully.');
      setTimeout(() => {
        if (res.user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(-1);
        }
      }, 700);
    } catch (err) {
      setApiError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-glow" />

      <div className="login-container container">
        {user ? (
          <div className="login-card">
            <div className="login-header">
              <div className="login-emblem">♦</div>
              <p className="eyebrow">AURA Client Privileged</p>
              <h1 className="login-title">Client Account</h1>
              <p className="login-subtitle">
                You are currently signed in as <strong>{user.name}</strong>
              </p>
            </div>

            <div className="login-account-details" style={{ margin: '1.5rem 0', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', marginBottom: '0.4rem' }}>
                Email: <span style={{ color: 'var(--cream)' }}>{user.email}</span>
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Account Tier: <span style={{ textTransform: 'capitalize', color: 'var(--gold-light)' }}>{user.role}</span>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <Link to="/shop" className="btn btn-gold" style={{ textAlign: 'center' }}>
                Explore Jewellery Collections
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-outline" style={{ textAlign: 'center' }}>
                  Open Admin Management
                </Link>
              )}
              <button
                type="button"
                className="btn btn-outline"
                onClick={logout}
                style={{ borderColor: 'rgba(190, 70, 70, 0.4)', color: '#ff9b9b' }}
              >
                Sign Out of AURA
              </button>
            </div>

            <div className="login-assurance" style={{ marginTop: '2rem' }}>
              <span>Encrypted &amp; Secure • AURA Concierge</span>
            </div>
          </div>
        ) : (
          <div className="login-card">
            {/* Brand Header */}
            <div className="login-header">
              <div className="login-emblem">♦</div>
              <p className="eyebrow">AURA Privilege</p>
              <h1 className="login-title">Welcome Back</h1>
              <p className="login-subtitle">Sign in to your AURA account</p>
            </div>

          {/* Status & Error Alerts */}
          {apiError && (
            <div className="login-alert login-alert-error" role="alert">
              <AlertCircle size={16} className="login-alert-icon" />
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className="login-alert login-alert-success" role="status">
              <span>{apiSuccess}</span>
            </div>
          )}

          {/* Form */}
          <form className="login-form" onSubmit={handleLogin} noValidate>
            {/* Email Field */}
            <div className="login-field">
              <label htmlFor="email" className="login-label">
                Email Address
              </label>
              <div className={`login-input-wrap ${emailError ? 'has-error' : ''}`}>
                <Mail size={16} className="login-input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="login-input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  onBlur={() => handleBlur('email')}
                  disabled={loading}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  required
                />
              </div>
              {emailError && (
                <p id="email-error" className="login-error-msg" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="login-field">
              <div className="login-field-header">
                <label htmlFor="password" className="login-label">
                  Password
                </label>
                <Link to="/forgot-password" className="login-forgot-link">
                  Forgot Password?
                </Link>
              </div>
              <div className={`login-input-wrap ${passwordError ? 'has-error' : ''}`}>
                <Lock size={16} className="login-input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="login-input login-input-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  onBlur={() => handleBlur('password')}
                  disabled={loading}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="login-error-msg" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="login-options-row">
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="login-checkbox"
                />
                <span className="login-checkbox-custom" />
                <span className="login-checkbox-text">Remember me</span>
              </label>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className="btn btn-gold login-submit-btn"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <span className="login-spinner-text">
                  <span className="login-spinner" />
                  Signing In…
                </span>
              ) : (
                <span className="login-btn-content">
                  Sign In
                  <ArrowRight size={15} />
                </span>
              )}
            </button>
          </form>

          {/* Alternative Social Login Divider */}
          <div className="login-divider" role="separator" aria-label="Alternative sign in option">
            <span className="login-divider-line" />
            <span className="login-divider-text">OR</span>
            <span className="login-divider-line" />
          </div>

          {/* Mock Google Login Button */}
          <button
            type="button"
            className="login-google-btn"
            onClick={() => navigate('/google-login-success')}
            aria-label="Continue with Google"
          >
            <svg
              className="login-google-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Registration CTA */}
          <div className="login-footer">
            <p className="login-register-text">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="login-register-link">
                Create an account
              </Link>
            </p>
          </div>

          {/* Security & Brand Assurance */}
          <div className="login-assurance">
            <span>Encrypted &amp; Secure • AURA Concierge</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

