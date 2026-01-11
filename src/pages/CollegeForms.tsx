import { useAppConfig } from '@contexts/AppConfigContext';
import { useForms } from '@contexts/FormsContext';
import React, { useState, useMemo } from 'react';

import { Form } from '@/types';

const DownloadIcon: React.FC = () => (
  <svg
    className="w-5 h-5 mr-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const BookmarkIcon: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
  <svg
    className="w-5 h-5"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
    />
  </svg>
);

const StarIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const FormCard: React.FC<{
  form: Form;
  isFavorite: boolean;
  onToggleFavorite: (formNumber: string) => void;
  onDownload: (form: Form) => void;
}> = ({ form, isFavorite, onToggleFavorite, onDownload }) => (
  <div className="group relative overflow-hidden bg-white dark:bg-dark-card p-4 sm:p-6 rounded-xl shadow-md flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-105 border-2 border-transparent hover:border-primary/30 dark:hover:border-secondary/30">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex-grow pr-2 group-hover:text-primary dark:group-hover:text-secondary transition-colors">
          {form.title}
        </h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          {form.formNumber && (
            <span className="text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-1 px-2 rounded-full whitespace-nowrap group-hover:bg-primary/10 dark:group-hover:bg-secondary/10 group-hover:text-primary dark:group-hover:text-secondary transition-colors">
              {form.formNumber}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(form.formNumber);
            }}
            className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
              isFavorite
                ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                : 'text-slate-400 hover:text-yellow-500 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <BookmarkIcon filled={isFavorite} />
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex-grow">
        <strong className="text-slate-700 dark:text-slate-300">Submit to:</strong> {form.submitTo}
      </p>
      <button
        onClick={() => onDownload(form)}
        className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary dark:from-secondary dark:to-secondary/80 dark:hover:from-secondary/80 dark:hover:to-secondary text-white font-medium rounded-lg transition-all duration-300 text-sm hover:shadow-lg hover:scale-105 active:scale-95"
      >
        <DownloadIcon />
        Download PDF
      </button>
    </div>
  </div>
);

const CollegeForms: React.FC = () => {
  const { userFormsData, loading, toggleFavorite, addRecentDownload } = useForms();
  const { config: appConfig } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const safeUserFormsData = userFormsData || { favorites: [], recentDownloads: [] };

  // Derive forms from config
  const allForms = useMemo(() => (appConfig?.forms || []) as Form[], [appConfig?.forms]);
  const generalForms = useMemo(() => allForms.filter((f) => f.category === 'general'), [allForms]);
  const ugForms = useMemo(() => allForms.filter((f) => f.category === 'ug'), [allForms]);
  const pgForms = useMemo(() => allForms.filter((f) => f.category === 'pg'), [allForms]);
  const phdForms = useMemo(() => allForms.filter((f) => f.category === 'phd'), [allForms]);

  const filters = ['All', 'Favorites', 'General', 'UG', 'PG', 'PhD'];

  // Handle download
  const handleDownload = async (form: Form) => {
    window.open(form.downloadLink, '_blank');
    await addRecentDownload(form);
  };

  const filterForms = (forms: Form[]) => {
    let filtered = forms;

    // Apply favorites filter
    if (activeFilter === 'Favorites') {
      filtered = filtered.filter((form) => safeUserFormsData.favorites.includes(form.formNumber));
    }

    // Apply search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (form) =>
          form.title.toLowerCase().includes(lowercasedTerm) ||
          form.formNumber.toLowerCase().includes(lowercasedTerm) ||
          form.submitTo.toLowerCase().includes(lowercasedTerm)
      );
    }

    return filtered;
  };

  const favoriteForms = useMemo(
    () => allForms.filter((form) => safeUserFormsData.favorites.includes(form.formNumber)),
    [allForms, safeUserFormsData.favorites]
  );

  const filteredGeneralForms = useMemo(
    () => filterForms(generalForms),
    [generalForms, searchTerm, safeUserFormsData.favorites, activeFilter]
  );
  const filteredUgForms = useMemo(
    () => filterForms(ugForms),
    [ugForms, searchTerm, safeUserFormsData.favorites, activeFilter]
  );
  const filteredPgForms = useMemo(
    () => filterForms(pgForms),
    [pgForms, searchTerm, safeUserFormsData.favorites, activeFilter]
  );
  const filteredPhdForms = useMemo(
    () => filterForms(phdForms),
    [phdForms, searchTerm, safeUserFormsData.favorites, activeFilter]
  );

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'UG':
        return 'Undergraduate (UG)';
      case 'PG':
        return 'Postgraduate (PG)';
      case 'PhD':
        return 'Doctoral (PhD)';
      default:
        return filter;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            College Forms
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Find and download important academic and administrative forms
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center justify-between text-white">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Forms</p>
              <p className="text-4xl font-black group-hover:scale-110 transition-transform origin-left">
                {allForms.length}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveFilter('Favorites')}
          className="group relative overflow-hidden bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center justify-between text-white">
            <div>
              <p className="text-yellow-100 text-sm font-medium mb-1">Your Favorites</p>
              <p className="text-4xl font-black group-hover:scale-110 transition-transform origin-left">
                {favoriteForms.length}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <StarIcon />
            </div>
          </div>
          {activeFilter === 'Favorites' && (
            <div className="absolute top-2 right-2 bg-white/30 backdrop-blur-sm rounded-full p-1">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        <div
          onClick={() => {
            setActiveFilter('All');
            // Scroll to recent downloads section
            setTimeout(() => {
              const element = document.getElementById('recent-downloads-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          }}
          className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 sm:col-span-2 lg:col-span-1 cursor-pointer active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center justify-between text-white">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Recent Downloads</p>
              <p className="text-4xl font-black group-hover:scale-110 transition-transform origin-left">
                {safeUserFormsData.recentDownloads.length}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <ClockIcon />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-white dark:bg-dark-card p-4 md:p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary dark:group-focus-within:text-secondary transition-colors">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search by form name, number, or submission office..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary focus:border-primary dark:focus:border-secondary transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-primary to-primary-dark dark:from-secondary dark:to-secondary/80 text-white shadow-lg shadow-primary/30 dark:shadow-secondary/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {getFilterLabel(filter)}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Section */}
      {activeFilter === 'Favorites' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
            <StarIcon />
            Your Favorite Forms
          </h2>
          {favoriteForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {favoriteForms.map((form, index) => (
                <FormCard
                  key={`favorite-${index}`}
                  form={form}
                  isFavorite={true}
                  onToggleFavorite={toggleFavorite}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-dark-card rounded-lg">
              <div className="text-slate-300 dark:text-slate-600 mb-4">
                <StarIcon />
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                No favorite forms yet. Click the bookmark icon to save forms!
              </p>
            </div>
          )}
        </div>
      )}

      {/* General Forms */}
      {(activeFilter === 'All' || activeFilter === 'General') && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
            General Academic Forms
          </h2>
          {filteredGeneralForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredGeneralForms.map((form, index) => (
                <FormCard
                  key={`general-${index}`}
                  form={form}
                  isFavorite={safeUserFormsData.favorites.includes(form.formNumber)}
                  onToggleFavorite={toggleFavorite}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">
                No general forms match your search.
              </p>
            </div>
          )}
        </div>
      )}

      {/* UG Forms */}
      {(activeFilter === 'All' || activeFilter === 'UG') && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
            Undergraduate (UG) Forms
          </h2>
          {filteredUgForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredUgForms.map((form, index) => (
                <FormCard
                  key={`ug-${index}`}
                  form={form}
                  isFavorite={safeUserFormsData.favorites.includes(form.formNumber)}
                  onToggleFavorite={toggleFavorite}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">No UG forms match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* PG Forms */}
      {(activeFilter === 'All' || activeFilter === 'PG') && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
            Postgraduate (PG) Forms
          </h2>
          {filteredPgForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredPgForms.map((form: Form, index: number) => (
                <FormCard
                  key={`pg-${index}`}
                  form={form}
                  isFavorite={safeUserFormsData.favorites.includes(form.formNumber)}
                  onToggleFavorite={toggleFavorite}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">No PG forms match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* PhD Forms */}
      {(activeFilter === 'All' || activeFilter === 'PhD') && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
            Doctoral (PhD) Forms
          </h2>
          {filteredPhdForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredPhdForms.map((form: Form, index: number) => (
                <FormCard
                  key={`phd-${index}`}
                  form={form}
                  isFavorite={safeUserFormsData.favorites.includes(form.formNumber)}
                  onToggleFavorite={toggleFavorite}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">No PhD forms match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Downloads Section */}
      {safeUserFormsData.recentDownloads.length > 0 && activeFilter === 'All' && (
        <div id="recent-downloads-section" className="space-y-4 scroll-mt-6">
          <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
            <ClockIcon />
            Recent Downloads
          </h2>
          <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="space-y-3">
              {safeUserFormsData.recentDownloads.slice(0, 10).map((download, index) => {
                const form = allForms.find((f) => f.formNumber === download.formNumber);
                if (!form) return null;
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border border-transparent hover:border-primary/30 dark:hover:border-secondary/30 gap-3"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="hidden sm:flex flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors line-clamp-2 sm:truncate">
                            {download.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                            <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                              {download.formNumber}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(download.timestamp).toLocaleDateString()} at{' '}
                              {new Date(download.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(form)}
                      className="relative z-10 w-full sm:w-auto sm:ml-4 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary dark:from-secondary dark:to-secondary/80 dark:hover:from-secondary/80 dark:hover:to-secondary text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 text-sm font-medium"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <span className="hidden sm:inline">Download Again</span>
                      <span className="sm:hidden">Download</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CollegeForms);
