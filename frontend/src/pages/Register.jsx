import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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

  // Validation & UI flow states
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
  const [isSuccess, setIsSuccess] = useState(false);
  const { register } = useAuth();

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
    // Extract numeric digits
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
      return 'You must agree to the Terms & Conditions and Privacy Policy.';
    }
    return null;
  }

  // Active validation errors (only shown once field is interacted with)
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
      await register({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password,
      });

      setIsSuccess(true);
    } catch (err) {
      setApiError(err.message || "We couldn't create your account right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-glow" />

      <div className="register-container container">
        {isSuccess ? (
          /* ====================================================================
             AURA Registration Success State
             ==================================================================== */
          <div className="register-card register-success-card">
            {/* Elegant Luxury Check Icon */}
            <div className="register-success-icon-wrap">
              <Check size={28} className="register-success-icon" aria-hidden="true" focusable="false" />
            </div>

            {/* Luxury Success Typography */}
            <h1 className="register-title register-success-title">Account Created Successfully</h1>
            <p className="register-success-desc">
              Welcome to AURA. Your journey with timeless jewellery begins here.
            </p>
            <p className="register-success-subtext">
              You can now sign in to your AURA account.
            </p>

            {/* Continue to Sign In CTA Button */}
            <Link to="/login" className="btn btn-gold register-success-btn">
              <span className="register-btn-content">
                <span>Continue to Sign In</span>
                <ArrowRight size={15} aria-hidden="true" focusable="false" />
              </span>
            </Link>

            {/* Security & Brand Assurance */}
            <div className="register-assurance register-success-assurance">
              <span>Encrypted &amp; Secure • AURA Concierge</span>
            </div>
          </div>
        ) : (
          /* ====================================================================
             AURA Registration Form
             ==================================================================== */
          <div className="register-card">
            {/* Brand Header */}
            <div className="register-header">
              <div className="register-emblem">♦</div>
              <p className="eyebrow">AURA Privilege</p>
              <h1 className="register-title">Create Your Account</h1>
              <p className="register-subtitle">Join AURA and make every moment timeless.</p>
            </div>

            {/* Status & Error Alerts */}
            {apiError && (
              <div className="register-alert register-alert-error" role="alert">
                <AlertCircle size={16} className="register-alert-icon" aria-hidden="true" focusable="false" />
                <div className="register-alert-text">
                  <strong className="register-alert-title">Registration Failed</strong>
                  <span className="register-alert-desc">{apiError}</span>
                </div>
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
                  <User size={16} className="register-input-icon" aria-hidden="true" focusable="false" />
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
                  <Mail size={16} className="register-input-icon" aria-hidden="true" focusable="false" />
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
                  <Phone size={16} className="register-input-icon" aria-hidden="true" focusable="false" />
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
                  <Lock size={16} className="register-input-icon" aria-hidden="true" focusable="false" />
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
                    {showPassword ? (
                      <EyeOff size={16} aria-hidden="true" focusable="false" />
                    ) : (
                      <Eye size={16} aria-hidden="true" focusable="false" />
                    )}
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
                  <Lock size={16} className="register-input-icon" aria-hidden="true" focusable="false" />
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
                    {showConfirmPassword ? (
                      <EyeOff size={16} aria-hidden="true" focusable="false" />
                    ) : (
                      <Eye size={16} aria-hidden="true" focusable="false" />
                    )}
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
                    <span className="register-spinner" aria-hidden="true" />
                    <span>Creating your account...</span>
                  </span>
                ) : (
                  <span className="register-btn-content">
                    <span>Create Account</span>
                    <ArrowRight size={15} aria-hidden="true" focusable="false" />
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
        )}
      </div>
    </div>
  );
}
