import React from 'react';

interface EBProps {
  children: React.ReactNode;
}

interface EBState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<EBProps, EBState> {
  state: EBState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: 'var(--bg-primary, #06071a)', color: 'white', gap: '16px', padding: '24px'
        }}>
          <h2 style={{ color: '#f43f5e', margin: 0 }}>Something went wrong</h2>
          <p style={{ color: '#94a3b8', maxWidth: '500px', textAlign: 'center', margin: 0 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="btn btn-primary"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
