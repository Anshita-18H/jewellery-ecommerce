import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

export default function AuthModal() {
  const { authModal, closeAuthModal, login, signup } = useAuth();
  const navigate = useNavigate();
  const { isOpen, initialMode, prompt } = authModal;

  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setError(null);
      setName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  function switchMode(newMode) {
    setMode(newMode);
    setError(null);
    setShowPassword(false);
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

  function handleGoogleLogin() {
    closeAuthModal();
    navigate('/google-login-success');
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
                type={showPassword ? 'text' : 'password'}
                className="auth-modal-input auth-modal-input-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="auth-modal-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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

        {/* Social Login Divider */}
        <div className="auth-modal-divider" role="separator" aria-label="Alternative sign-in option">
          <span className="auth-modal-divider-line" />
          <span className="auth-modal-divider-text">OR</span>
          <span className="auth-modal-divider-line" />
        </div>

        {/* Mock Google Login Button */}
        <button
          type="button"
          className="auth-modal-google-btn"
          onClick={handleGoogleLogin}
          aria-label="Continue with Google"
        >
          <svg
            className="auth-modal-google-icon"
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

