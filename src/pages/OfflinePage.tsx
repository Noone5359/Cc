import { WifiOff, RefreshCw, Home, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const OfflinePage: React.FC = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    window.location.reload();
  };

  const cachedPages = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Grades', icon: GraduationCap, path: '/grades' },
    { name: 'Schedule', icon: Calendar, path: '/schedule' },
    { name: 'Academic Calendar', icon: BookOpen, path: '/academic-calendar' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6">
            <WifiOff size={48} className="text-orange-500" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            You're Offline
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
            It looks like you've lost your internet connection. Don't worry, some features are still
            available offline!
          </p>

          {/* Retry Button */}
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg mb-8"
          >
            <RefreshCw size={20} />
            Retry Connection
          </button>

          {/* Cached Pages Section */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
              Available Offline
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cachedPages.map((page) => (
                <button
                  key={page.path}
                  onClick={() => navigate(page.path)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                >
                  <page.icon
                    size={32}
                    className="text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                    {page.name}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              These pages were cached during your last visit and can be viewed offline.
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            💡 <strong>Tip:</strong> Once you're back online, refresh the page to access all
            features.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
