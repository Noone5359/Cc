import { useAppConfig } from '@contexts/AppConfigContext';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { config: appConfig } = useAppConfig();
  const navigate = useNavigate();

  return (
    <footer className="relative bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 backdrop-blur-lg border-t border-slate-700/60 mt-auto overflow-hidden">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>

      {/* Animated background accents - hide on mobile for performance */}
      <div className="absolute inset-0 opacity-20 hidden sm:block">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative">
        {/* Main Footer Content */}
        <div className="py-3 sm:py-4 md:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Brand Section */}
            <div className="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col items-center sm:items-start gap-3 sm:gap-4">
              <div
                className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
                onClick={() => navigate('/admin/college-info')}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition-all duration-300 group-hover:scale-110"></div>
                  <div className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 p-2 sm:p-2.5 rounded-xl shadow-lg group-hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-105">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-300 group-hover:rotate-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:via-pink-300 group-hover:to-purple-300 transition-all duration-300">
                    College Central
                  </h3>
                  <p className="text-xs text-slate-400 font-medium group-hover:text-purple-400 transition-colors">
                    {appConfig?.collegeInfo?.name?.short}
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 text-center sm:text-left max-w-xs leading-relaxed hidden sm:block">
                Manage college data, users, and content from this centralized dashboard.
              </p>
            </div>

            {/* Quick Links Section - hide on xs, show on sm+ */}
            <div className="hidden sm:flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Quick Links
                </h4>
              </div>
              <nav className="flex flex-col gap-1.5 sm:gap-2">
                <Link
                  to="/admin/analytics"
                  className="group text-xs sm:text-sm text-slate-400 hover:text-purple-400 transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-purple-500 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all"></span>
                  Analytics Dashboard
                </Link>
                <Link
                  to="/admin/college-info"
                  className="group text-xs sm:text-sm text-slate-400 hover:text-purple-400 transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-purple-500 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all"></span>
                  College Information
                </Link>
                <Link
                  to="/admin/directory"
                  className="group text-xs sm:text-sm text-slate-400 hover:text-purple-400 transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-purple-500 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all"></span>
                  Faculty Directory
                </Link>
                <Link
                  to="/admin/students"
                  className="group text-xs sm:text-sm text-slate-400 hover:text-purple-400 transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-purple-500 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all"></span>
                  Student Directory
                </Link>
              </nav>
            </div>

            {/* Resources Section - hide on xs, show on sm+ */}
            <div className="hidden sm:flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full"></div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Resources
                </h4>
              </div>
              <div className="flex gap-2 sm:gap-3 mb-3">
                <a
                  href="mailto:collegecentral01@gmail.com"
                  className="group relative p-2 sm:p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/50 overflow-hidden"
                  aria-label="Email Support"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:rotate-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="4"
                      width="20"
                      height="16"
                      rx="2"
                      className="group-hover:fill-white/10 transition-all duration-300"
                    />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </a>
                <Link
                  to="/"
                  className="group relative p-2 sm:p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/50 overflow-hidden"
                  aria-label="User Dashboard"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </Link>
                <a
                  href="https://drive.google.com/file/d/165efBK3Z0QPOoj7mpry-SzAoFZo-uHED/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 sm:p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-green-500/50 overflow-hidden"
                  aria-label="Documentation"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative border-t border-slate-700/60 py-3 sm:py-4">
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
            <p className="text-[10px] sm:text-xs text-slate-500 text-center sm:text-left font-medium">
              © {currentYear}{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">
                College Central
              </span>
              . All rights reserved.
            </p>
            <div className="flex items-center gap-1 sm:gap-3 text-[10px] sm:text-xs">
              <Link
                to="/privacy"
                className="group relative px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-slate-400 hover:text-purple-400 transition-all duration-200 hover:bg-slate-800 overflow-hidden"
              >
                <span className="relative z-10">Privacy Policy</span>
              </Link>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <Link
                to="/terms"
                className="group relative px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-slate-400 hover:text-purple-400 transition-all duration-200 hover:bg-slate-800 overflow-hidden"
              >
                <span className="relative z-10">Terms of Service</span>
              </Link>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <Link
                to="/admin/support"
                className="group relative px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-slate-400 hover:text-purple-400 transition-all duration-200 hover:bg-slate-800 overflow-hidden inline-flex items-center gap-1"
              >
                <span className="relative z-10">Support</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(AdminFooter);
