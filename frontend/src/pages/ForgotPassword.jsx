import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import './Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    setError(null);
    setSubmitted(true);
  }

  return (
    <div className="login-page">
      <div className="login-glow" />
      <div className="login-container container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-emblem">♦</div>
            <p className="eyebrow">Password Recovery</p>
            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">
              {submitted
                ? 'Check your inbox for reset instructions'
                : 'Enter your email to receive password recovery instructions'}
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
                <span>Recovery instructions have been sent to <strong>{email}</strong> if an account exists.</span>
              </div>
              <Link to="/login" className="btn btn-gold" style={{ width: '100%' }}>
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
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-gold login-submit-btn">
                Send Recovery Instructions
              </button>

              <div className="login-footer" style={{ marginTop: '1.5rem', paddingTop: '1.2rem' }}>
                <Link to="/login" className="login-register-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
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

