import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log to Firebase Analytics if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px',
          backgroundColor: '#F2F2F2',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#000',
              marginBottom: '16px'
            }}>
              Something went wrong
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'rgba(0,0,0,0.7)',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              We're sorry for the inconvenience. The error has been logged and we'll look into it.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#EECF00',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Reload Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '24px',
                textAlign: 'left',
                fontSize: '12px',
                color: '#666'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  overflow: 'auto'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
