'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in all environments for debugging
    console.error('Error boundary caught:', error);
  }, [error]);

  // SECURITY: Production mode - sanitized errors only
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md border-2 border-red-600 rounded-lg p-8 bg-red-50">
          <h2 className="text-2xl font-mono font-bold mb-4 text-red-900">
            Something went wrong
          </h2>
          <p className="text-sm font-mono mb-6 text-red-800">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
          {error.digest && (
            <p className="text-xs font-mono mb-6 text-red-700">
              Error ID: {error.digest}
            </p>
          )}
          <Button
            onClick={reset}
            className="w-full font-mono"
            variant="default"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Development: Show full errors for debugging
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <div className="w-full max-w-2xl border-2 border-yellow-600 rounded-lg p-8 bg-yellow-50">
        <h2 className="text-2xl font-mono font-bold mb-4 text-yellow-900">
          Development Error
        </h2>
        <div className="mb-6">
          <p className="text-sm font-mono font-bold mb-2 text-yellow-800">
            Message:
          </p>
          <p className="text-sm font-mono mb-4 text-red-600">
            {error.message}
          </p>
          {error.stack && (
            <>
              <p className="text-sm font-mono font-bold mb-2 text-yellow-800">
                Stack Trace:
              </p>
              <pre className="text-xs font-mono bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96">
                {error.stack}
              </pre>
            </>
          )}
        </div>
        <Button
          onClick={reset}
          className="w-full font-mono"
          variant="default"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
