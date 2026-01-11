import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

const ErrorBoundary: React.FC = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
          <div className="text-center px-4">
            <h1 className="text-9xl font-bold text-primary">404</h1>
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mt-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-4 mb-8 max-w-md mx-auto">
              Sorry, the page you're looking for doesn't exist. It might have been moved or deleted.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center px-4">
          <h1 className="text-6xl font-bold text-red-600 dark:text-red-400">{error.status}</h1>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-4">
            {error.statusText}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4 mb-8">
            {error.data?.message || 'An error occurred while processing your request.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors duration-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Handle non-route errors
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-4">
            <svg
              className="w-12 h-12 text-red-600 dark:text-red-400 mr-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              Application Error
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Oops! Something went wrong. Please try again or contact support if the problem persists.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="font-mono text-sm text-red-800 dark:text-red-300 break-all">
              {errorMessage}
            </p>
            {errorStack && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200">
                  Show stack trace
                </summary>
                <pre className="mt-2 text-xs text-red-800 dark:text-red-300 overflow-x-auto">
                  {errorStack}
                </pre>
              </details>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Reload Page
            </button>
            <Link
              to="/"
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors duration-200"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
