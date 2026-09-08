import React from 'react';

/**
 * Global React Error Boundary
 * Catches render/runtime crashes and presents a warm Cassiel-styled fallback UI
 * with Reload and Session Reset options.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('[ErrorBoundary] Caught runtime exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      window.sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          minHeight: '100dvh',
          width: '100%',
          backgroundColor: '#F8EFE6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
          textAlign: 'center',
          color: '#333333'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: 'rgba(217, 119, 6, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            margin: '0 0 8px 0',
            color: '#2D2319'
          }}>
            Terjadi Kesalahan Tampilan
          </h2>

          <p style={{
            fontSize: '14px',
            color: '#7C6F62',
            maxWidth: '320px',
            lineHeight: 1.5,
            margin: '0 0 24px 0'
          }}>
            Aplikasi mengalami kendala saat memuat antarmuka. Silakan muat ulang atau segarkan sesi.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.28)'
              }}
            >
              Muat Ulang
            </button>

            <button
              onClick={this.handleReset}
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                color: '#6B5E51',
                border: 'none',
                borderRadius: '14px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reset Sesi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
