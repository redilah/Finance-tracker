import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Cassiel ErrorBoundary] Caught runtime error:', error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: null });
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
            padding: '24px',
            backgroundColor: '#F5EBE1',
            color: '#1C1917',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px 24px',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 12px 32px rgba(28, 25, 23, 0.08)',
            }}
          >
            <h2 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 700 }}>
              Tampilan Sedang Disegarkan
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#57534E', lineHeight: 1.5 }}>
              Tenang, seluruh data transaksi dan saldomu tetap aman 100%. Tekan tombol di bawah untuk melanjutkan.
            </p>
            <button
              type="button"
              onClick={this.handleRecover}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Lanjutkan ke Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
