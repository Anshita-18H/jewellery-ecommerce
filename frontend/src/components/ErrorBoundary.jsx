import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AURA Application Runtime Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0B0A09',
            color: '#F5F0E8',
            fontFamily: "'Playfair Display', Georgia, serif",
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ color: '#C9A45C', fontSize: '2.25rem', marginBottom: '1rem', letterSpacing: '0.05em' }}>
            AURA
          </h1>
          <p style={{ color: '#C9C0B4', fontSize: '1.1rem', maxWidth: '500px', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Something interrupted your luxury browsing experience. Please reload to refresh the gallery.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#C9A45C',
              color: '#0B0A09',
              border: 'none',
              borderRadius: '2px',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
