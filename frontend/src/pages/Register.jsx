import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Login.css';

export default function Register() {
  return (
    <div className="login-page">
      <div className="login-glow" />
      <div className="login-container container">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="login-emblem">♦</div>
          <p className="eyebrow">AURA Privilege</p>
          <h1 className="login-title">Create Account</h1>
          <p className="login-subtitle" style={{ marginBottom: '1.8rem' }}>
            Registration will be available soon.
          </p>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: '1.6', marginBottom: '2rem' }}>
            Our online client registration portal is currently being prepared. If you are already an existing client or administrator, please sign in.
          </p>

          <Link to="/login" className="btn btn-gold" style={{ width: '100%' }}>
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

