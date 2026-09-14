import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { RefreshCw } from 'lucide-react';

export default function ProtectedAdminRoute({ children }) {
  const { adminUser, adminLoading } = useAdminAuth();
  const location = useLocation();

  if (adminLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--text-body)',
          gap: '1.2rem',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ color: 'var(--gold)', fontSize: '1.6rem' }}>♦</div>
        <RefreshCw size={24} className="admin-spin" style={{ color: 'var(--gold)' }} />
        <p style={{ fontSize: '0.88rem', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          Verifying Administrator Credentials…
        </p>
      </div>
    );
  }

  if (!adminUser) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}

