import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { verifyResetToken, resetPassword } from '../api';
import './Login.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();

  // Extract token from query param, hash query param, or window search
  function getResetToken() {
    const fromRouter = searchParams.get('token');
    if (fromRouter) return fromRouter.trim();

    const fromWindowSearch = new URLSearchParams(window.location.search).get('token');
    if (fromWindowSearch) return fromWindowSearch.trim();

    const hashPart = window.location.hash || '';
    if (hashPart.includes('?')) {
      const fromHash = new URLSearchParams(hashPart.split('?')[1]).get('token');
      if (fromHash) return fromHash.trim();
    }

    return '';
  }

  const token = getResetToken();

  const [verifying, setVerifying] = useState(true);
  const [tokenError, setTokenError] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Verify token validity on initial mount
  useEffect(() => {
    if (!token) {
      setTokenError('No password reset token was provided. Please request a new reset link.');
      setVerifying(false);
      return;
    }

    let isMounted = true;
    verifyResetToken(token)
      .then(() => {
        if (isMounted) {
          setVerifying(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setTokenError(
            err.message ||
              'This password reset link is invalid or has expired. Please request a new one.'
          );
          setVerifying(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  function validate() {
    const errors = {};
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await resetPassword(token, password);
      setResetSuccess(true);
    } catch (err) {
      setSubmitError(
        err.message || 'Unable to reset your password. Please try again or request a new link.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-glow" />

      <div className="login-container container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-emblem">♦</div>
            <p className="eyebrow">AURA Security</p>
            <h1 className="login-title">Choose New Password</h1>
            <p className="login-subtitle">
              {resetSuccess
                ? 'Your credentials have been securely updated.'
                : 'Select a secure password of at least 6 characters for your account.'}
            </p>
          </div>

          {/* Token Verification Loading State */}
          {verifying && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '2px solid rgba(201, 164, 92, 0.25)',
                  borderTopColor: 'var(--gold-bright)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 1.2rem',
                }}
              />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Verifying your secure reset link…
              </p>
            </div>
          )}

          {/* Invalid or Expired Token State */}
          {!verifying && tokenError && (
            <div style={{ textAlign: 'center' }}>
              <div className="login-alert login-alert-error" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={18} className="login-alert-icon" />
                <span>{tokenError}</span>
              </div>
              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.6',
                  marginBottom: '1.8rem',
                }}
              >
                For your security, password reset links expire after 30 minutes and can only be used
                once.
              </p>
              <Link to="/forgot-password" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                Request New Reset Link
              </Link>
            </div>
          )}

          {/* Success State */}
          {!verifying && !tokenError && resetSuccess && (
            <div style={{ textAlign: 'center' }}>
              <div className="login-alert login-alert-success" style={{ marginBottom: '1.8rem' }}>
                <CheckCircle2 size={18} className="login-alert-icon" />
                <span>Your password has been reset successfully.</span>
              </div>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-body)',
                  lineHeight: '1.6',
                  marginBottom: '2rem',
                }}
              >
                You can now sign in to your AURA Fine Jewellery account using your updated password.
              </p>
              <Link
                to="/login"
                className="btn btn-gold"
                style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
              >
                <ShieldCheck size={16} />
                Proceed to Sign In
              </Link>
            </div>
          )}

          {/* Reset Password Form */}
          {!verifying && !tokenError && !resetSuccess && (
            <>
              {submitError && (
                <div className="login-alert login-alert-error" role="alert">
                  <AlertCircle size={16} className="login-alert-icon" />
                  <span>{submitError}</span>
                </div>
              )}

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                {/* New Password */}
                <div className="login-field">
                  <label htmlFor="new-password" className="login-label">
                    New Password
                  </label>
                  <div className={`login-input-wrap ${fieldErrors.password ? 'has-error' : ''}`}>
                    <Lock size={16} className="login-input-icon" />
                    <input
                      id="new-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="login-input login-input-password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({ ...prev, password: null }));
                        }
                        if (submitError) setSubmitError(null);
                      }}
                      disabled={loading}
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
                  {fieldErrors.password && (
                    <p className="login-error-msg" role="alert">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="login-field">
                  <label htmlFor="confirm-password" className="login-label">
                    Confirm New Password
                  </label>
                  <div
                    className={`login-input-wrap ${
                      fieldErrors.confirmPassword ? 'has-error' : ''
                    }`}
                  >
                    <Lock size={16} className="login-input-icon" />
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="login-input login-input-password"
                      placeholder="Repeat your new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) {
                          setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                        }
                        if (submitError) setSubmitError(null);
                      }}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="login-error-msg" role="alert">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-gold login-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Updating Password…' : 'Reset Password'}
                  {!loading && <ArrowRight size={16} />}
                </button>

                <div
                  className="login-footer"
                  style={{ marginTop: '1.4rem', paddingTop: '1.1rem' }}
                >
                  <Link to="/login" className="login-register-link">
                    Cancel and Return to Sign In
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

