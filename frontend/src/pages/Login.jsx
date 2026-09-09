import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import './Login.css';

export default function Login() {
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
      /* ==========================================================================
         FUTURE BACKEND AUTHENTICATION INTEGRATION POINT
         --------------------------------------------------------------------------
         When the backend authentication API is ready, connect here:

         const response = await fetch('/api/auth/login', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           credentials: 'include', // for session/cookie auth
           body: JSON.stringify({
             email: email.trim(),
             password,
             rememberMe,
           }),
         });

         const data = await response.json();

         if (!response.ok) {
           throw new Error(data.error || 'Invalid email or password');
         }

         // Successful authentication:
         // 1. Update user session/auth context
         // 2. Redirect to account or previous page: navigate('/account');
         ========================================================================== */

      // Simulated brief delay to provide responsive feedback
      await new Promise((resolve) => setTimeout(resolve, 800));

      setApiSuccess('Form validated. Ready to connect to POST /api/auth/login.');
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
      </div>
    </div>
  );
}

