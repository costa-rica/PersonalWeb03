'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in all environments for debugging
    console.error('Global error boundary caught:', error);
  }, [error]);

  // SECURITY: Production mode - sanitized errors only
  if (process.env.NODE_ENV === 'production') {
    return (
      <html>
        <body>
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '28rem',
                border: '2px solid #dc2626',
                borderRadius: '0.5rem',
                padding: '2rem',
                backgroundColor: '#fef2f2',
              }}
            >
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  color: '#7f1d1d',
                }}
              >
                Application Error
              </h2>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  marginBottom: '1.5rem',
                  color: '#991b1b',
                }}
              >
                A critical error occurred. Please refresh the page or contact support if the problem persists.
              </p>
              {error.digest && (
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    marginBottom: '1.5rem',
                    color: '#b91c1c',
                  }}
                >
                  Error ID: {error.digest}
                </p>
              )}
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  fontFamily: 'monospace',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // Development: Show full errors for debugging
  return (
    <html>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: '#f3f4f6',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '42rem',
              border: '2px solid #ca8a04',
              borderRadius: '0.5rem',
              padding: '2rem',
              backgroundColor: '#fefce8',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#713f12',
              }}
            >
              Development Global Error
            </h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: '#854d0e',
                }}
              >
                Message:
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  marginBottom: '1rem',
                  color: '#dc2626',
                }}
              >
                {error.message}
              </p>
              {error.stack && (
                <>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      color: '#854d0e',
                    }}
                  >
                    Stack Trace:
                  </p>
                  <pre
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      backgroundColor: '#1f2937',
                      color: '#4ade80',
                      padding: '1rem',
                      borderRadius: '0.25rem',
                      overflow: 'auto',
                      maxHeight: '24rem',
                    }}
                  >
                    {error.stack}
                  </pre>
                </>
              )}
            </div>
            <button
              onClick={reset}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                fontFamily: 'monospace',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
