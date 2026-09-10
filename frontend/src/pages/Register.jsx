import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import './Register.css';

export default function Register() {
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation & UI states
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    agreeTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  // Validation helpers
  function validateFullName(val) {
    if (!val || !val.trim()) {
      return 'Please enter your full name.';
    }
    if (val.trim().length < 2) {
      return 'Full name must contain at least 2 characters.';
    }
    return null;
  }

  function validateEmail(val) {
    if (!val || !val.trim()) {
      return 'Please enter your email address.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      return 'Please enter a valid email address.';
    }
    return null;
  }

  function validatePhone(val) {
    if (!val || !val.trim()) {
      return 'Please enter your phone number.';
    }
    // Clean string to digits only
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return 'Please enter a valid phone number (at least 10 digits).';
    }
    return null;
  }

  function validatePassword(val) {
    if (!val) {
      return 'Please enter a password.';
    }
    if (val.length < 8) {
      return 'Password must contain at least 8 characters.';
    }
    return null;
  }

  function validateConfirmPassword(val, pwd) {
    if (!val) {
      return 'Please confirm your password.';
    }
    if (val !== pwd) {
      return 'Passwords do not match.';
    }
    return null;
  }

  function validateAgreeTerms(val) {
    if (!val) {
      return 'Please accept the Terms & Conditions.';
    }
    return null;
  }

  // Active validation errors (only shown if field has been interacted with)
  const fullNameError = touched.fullName ? validateFullName(fullName) : null;
  const emailError = touched.email ? validateEmail(email) : null;
  const phoneError = touched.phone ? validatePhone(phone) : null;
  const passwordError = touched.password ? validatePassword(password) : null;
  const confirmPasswordError = touched.confirmPassword ? validateConfirmPassword(confirmPassword, password) : null;
  const termsError = touched.agreeTerms ? validateAgreeTerms(agreeTerms) : null;

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleRegister(e) {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    // Mark all fields as touched on submit attempt
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    const fnErr = validateFullName(fullName);
    const emErr = validateEmail(email);
    const phErr = validatePhone(phone);
    const pwErr = validatePassword(password);
    const cpErr = validateConfirmPassword(confirmPassword, password);
    const tmErr = validateAgreeTerms(agreeTerms);

    if (fnErr || emErr || phErr || pwErr || cpErr || tmErr) {
      return;
    }

    setLoading(true);

    try {
      /* ==========================================================================
         FUTURE BACKEND REGISTRATION INTEGRATION POINT
         --------------------------------------------------------------------------
         When the backend registration API is ready, connect here:

         const response = await fetch('/api/auth/register', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           credentials: 'include',
           body: JSON.stringify({
             fullName: fullName.trim(),
             email: email.trim(),
             phone: phone.trim(),
             password,
           }),
         });

         const data = await response.json();

         if (!response.ok) {
           throw new Error(data.error || 'Failed to create account. Please try again.');
         }
         ========================================================================== */

      // Simulated brief delay for UX demonstration
      await new Promise((resolve) => setTimeout(resolve, 800));

      setApiSuccess('Account details validated! Ready to connect to POST /api/auth/register.');
    } catch (err) {
      setApiError(err.message || 'Unable to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-glow" />

      <div className="register-container container">
        <div className="register-card">
          {/* Brand Header */}
          <div className="register-header">
            <div className="register-emblem">♦</div>
            <p className="eyebrow">AURA Privilege</p>
            <h1 className="register-title">Create Account</h1>
            <p className="register-subtitle">Join the world of AURA fine jewellery</p>
          </div>

          {/* Status & Error Alerts */}
          {apiError && (
            <div className="register-alert register-alert-error" role="alert">
              <AlertCircle size={16} className="register-alert-icon" />
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className="register-alert register-alert-success" role="status">
              <CheckCircle2 size={16} className="register-alert-icon" />
              <span>{apiSuccess}</span>
            </div>
          )}

          {/* Registration Form */}
          <form className="register-form" onSubmit={handleRegister} noValidate>
            {/* Full Name Field */}
            <div className="register-field">
              <label htmlFor="fullName" className="register-label">
                Full Name
              </label>
              <div className={`register-input-wrap ${fullNameError ? 'has-error' : ''}`}>
                <User size={16} className="register-input-icon" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  className="register-input"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  onBlur={() => handleBlur('fullName')}
                  disabled={loading}
                  aria-invalid={!!fullNameError}
                  aria-describedby={fullNameError ? 'fullName-error' : undefined}
                  required
                />
              </div>
              {fullNameError && (
                <p id="fullName-error" className="register-error-msg" role="alert">
                  {fullNameError}
                </p>
              )}
            </div>

            {/* Email Address Field */}
            <div className="register-field">
              <label htmlFor="email" className="register-label">
                Email Address
              </label>
              <div className={`register-input-wrap ${emailError ? 'has-error' : ''}`}>
                <Mail size={16} className="register-input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="register-input"
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
                <p id="email-error" className="register-error-msg" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            {/* Phone Number Field */}
            <div className="register-field">
              <label htmlFor="phone" className="register-label">
                Phone Number
              </label>
              <div className={`register-input-wrap ${phoneError ? 'has-error' : ''}`}>
                <Phone size={16} className="register-input-icon" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="register-input"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  onBlur={() => handleBlur('phone')}
                  disabled={loading}
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? 'phone-error' : undefined}
                  required
                />
              </div>
              {phoneError && (
                <p id="phone-error" className="register-error-msg" role="alert">
                  {phoneError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="register-field">
              <label htmlFor="password" className="register-label">
                Password
              </label>
              <div className={`register-input-wrap ${passwordError ? 'has-error' : ''}`}>
                <Lock size={16} className="register-input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="register-input register-input-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  onBlur={() => handleBlur('password')}
                  disabled={loading}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : 'password-hint'}
                  required
                />
                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p id="password-hint" className="register-requirement-hint">
                Password must contain at least 8 characters.
              </p>
              {passwordError && (
                <p id="password-error" className="register-error-msg" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="register-field">
              <label htmlFor="confirmPassword" className="register-label">
                Confirm Password
              </label>
              <div className={`register-input-wrap ${confirmPasswordError ? 'has-error' : ''}`}>
                <Lock size={16} className="register-input-icon" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="register-input register-input-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  onBlur={() => handleBlur('confirmPassword')}
                  disabled={loading}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={confirmPasswordError ? 'confirmPassword-error' : undefined}
                  required
                />
                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  tabIndex={0}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPasswordError && (
                <p id="confirmPassword-error" className="register-error-msg" role="alert">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="register-field register-terms-field">
              <label className="register-checkbox-label">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (touched.agreeTerms) handleBlur('agreeTerms');
                  }}
                  disabled={loading}
                  className="register-checkbox"
                />
                <span className="register-checkbox-custom" />
                <span className="register-checkbox-text">
                  I agree to the{' '}
                  <span className="register-terms-link">Terms &amp; Conditions</span>
                  {' '}and{' '}
                  <span className="register-terms-link">Privacy Policy</span>.
                </span>
              </label>
              {termsError && (
                <p className="register-error-msg" role="alert" style={{ marginTop: '0.4rem' }}>
                  {termsError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-gold register-submit-btn"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <span className="register-spinner-text">
                  <span className="register-spinner" />
                  Creating Account…
                </span>
              ) : (
                <span className="register-btn-content">
                  Create Account
                  <ArrowRight size={15} />
                </span>
              )}
            </button>
          </form>

          {/* Login CTA Footer */}
          <div className="register-footer">
            <p className="register-login-text">
              Already have an account?{' '}
              <Link to="/login" className="register-login-link">
                Sign In
              </Link>
            </p>
          </div>

          {/* Security & Brand Assurance */}
          <div className="register-assurance">
            <span>Encrypted &amp; Secure • AURA Concierge</span>
          </div>
        </div>
      </div>
    </div>
  );
}
