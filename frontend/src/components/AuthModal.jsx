import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

export default function AuthModal() {
  const { authModal, closeAuthModal, login, signup } = useAuth();
  const { isOpen, initialMode, prompt } = authModal;

  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setError(null);
      setName('');
      setEmail('');
      setPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  function switchMode(newMode) {
    setMode(newMode);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (mode === 'signup' && (!name || !name.trim())) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup({ name: name.trim(), email: cleanEmail, password });
      } else {
        await login({ email: cleanEmail, password });
      }
      closeAuthModal();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div className="auth-modal-header text-center">
          <div className="auth-modal-emblem">♦</div>
          <p className="eyebrow">AURA Privilege</p>
          <h2 className="auth-modal-title">
            {mode === 'login' ? 'Sign In to AURA' : 'Create an Account'}
          </h2>
          {prompt ? (
            <p className="auth-modal-prompt">{prompt}</p>
          ) : (
            <p className="auth-modal-sub">
              {mode === 'login'
                ? 'Sign in to access your curated keepsakes and wishlist.'
                : 'Join AURA to save timeless pieces to your private wishlist.'}
            </p>
          )}
        </div>

        {/* Tab Selector */}
        <div className="auth-modal-tabs">
          <button
            type="button"
            className={`auth-modal-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-modal-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="auth-modal-error" role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-modal-form" onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <div className="auth-modal-field">
              <label className="auth-modal-label" htmlFor="modal-name">
                Full Name
              </label>
              <div className="auth-modal-input-wrap">
                <User size={16} className="auth-modal-input-icon" />
                <input
                  id="modal-name"
                  type="text"
                  className="auth-modal-input"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-modal-field">
            <label className="auth-modal-label" htmlFor="modal-email">
              Email Address
            </label>
            <div className="auth-modal-input-wrap">
              <Mail size={16} className="auth-modal-input-icon" />
              <input
                id="modal-email"
                type="email"
                className="auth-modal-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="auth-modal-field">
            <label className="auth-modal-label" htmlFor="modal-password">
              Password
            </label>
            <div className="auth-modal-input-wrap">
              <Lock size={16} className="auth-modal-input-icon" />
              <input
                id="modal-password"
                type="password"
                className="auth-modal-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-gold auth-modal-submit-btn"
            disabled={loading}
          >
            {loading ? (
              'Processing…'
            ) : mode === 'login' ? (
              <>
                Sign In <ArrowRight size={16} />
              </>
            ) : (
              <>
                Create Account <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-modal-footer">
          {mode === 'login' ? (
            <p>
              Don&apos;t have an account yet?{' '}
              <button
                type="button"
                className="auth-modal-link-btn"
                onClick={() => switchMode('signup')}
              >
                Create one here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-modal-link-btn"
                onClick={() => switchMode('login')}
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

