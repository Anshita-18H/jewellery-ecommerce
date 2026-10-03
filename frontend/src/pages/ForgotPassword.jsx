import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { requestPasswordReset } from '../api';
import './Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      setSuccessMessage(
        res.message ||
          'If an account with that email exists, a password reset link has been sent.'
      );
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Unable to process reset request. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-glow" />
      <div className="login-container container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-emblem">♦</div>
            <p className="eyebrow">Password Recovery</p>
            <h1 className="login-title">Forgot Password</h1>
            <p className="login-subtitle">
              {submitted
                ? 'Check your inbox for reset instructions'
                : 'Enter your registered email address to receive a secure password reset link.'}
            </p>
          </div>

          {error && (
            <div className="login-alert login-alert-error" role="alert">
              <AlertCircle size={16} className="login-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <div className="login-alert login-alert-success" style={{ marginBottom: '2rem' }}>
                <CheckCircle2 size={16} className="login-alert-icon" />
                <span>{successMessage}</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Please check your email inbox and spam folder. The reset link will remain active for 30 minutes.
              </p>
              <Link to="/login" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                <ArrowLeft size={16} />
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="login-field">
                <label htmlFor="recovery-email" className="login-label">
                  Email Address
                </label>
                <div className="login-input-wrap">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    id="recovery-email"
                    type="email"
                    className="login-input"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-gold login-submit-btn"
                disabled={loading}
              >
                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </button>

              <div className="login-footer" style={{ marginTop: '1.5rem', paddingTop: '1.2rem' }}>
                <Link
                  to="/login"
                  className="login-register-link"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

