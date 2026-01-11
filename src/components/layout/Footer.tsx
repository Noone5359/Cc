import { LogoIcon } from '@components/icons/SidebarIcons';
import { useAppConfig } from '@contexts/AppConfigContext';
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { config: appConfig } = useAppConfig();

  return (
    <footer className="relative bg-gradient-to-b from-white/80 via-slate-50/80 to-white/80 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-900/80 backdrop-blur-lg border-t border-slate-200/60 dark:border-slate-800/60 mt-auto overflow-hidden">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

      {/* Animated background accents */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Main Footer Content */}
        <div className="py-4 md:py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {/* Brand Section */}
            <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition-all duration-300 group-hover:scale-110"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
                    <LogoIcon className="w-6 h-6 text-white transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-blue-500 transition-all duration-300">
                    College Central
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {appConfig?.collegeInfo?.name?.short}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center md:text-left max-w-xs leading-relaxed">
                Your comprehensive campus companion for academics, schedules, and campus life.
              </p>
            </div>

            {/* Quick Links Section */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Quick Links
                </h4>
              </div>
              <nav className="flex flex-col gap-2">
                <Link
                  to="/grades"
                  className="group text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all"></span>
                  Academic Grades
                </Link>
                <Link
                  to="/schedule"
                  className="group text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all"></span>
                  Class Schedule
                </Link>
                <a
                  href="https://drive.google.com/file/d/1LZ4T36ZMcFypJy2l5-PBNkn4fZpXVsfX/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all"></span>
                  Documentation
                  <svg
                    className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                <a
                  href="https://forms.gle/kep4VdMWhXJ9879z6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all"></span>
                  Feedback Form
                  <svg
                    className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </nav>
            </div>

            {/* Connect Section */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-blue-600 rounded-full"></div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Connect
                </h4>
              </div>
              <div className="flex gap-3 mb-3">
                {/* <a
                  href="https://www.linkedin.com/in/preethamnimmagadda/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/50 overflow-hidden"
                  aria-label="LinkedIn"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a> */}
                {/* <a
                  href="https://github.com/PreethamNimmagadda02/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-slate-900/50 overflow-hidden"
                  aria-label="GitHub"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a> */}
                <a
                  href="mailto:collegecentral01@gmail.com"
                  className="group relative p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white dark:hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-red-500/50 overflow-hidden"
                  aria-label="Gmail"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <svg
                    className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-6"
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
              </div>
              <div className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800/50 dark:to-slate-800/30 border border-blue-100 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 text-center md:text-left font-medium">
                  Built with passion for the {appConfig?.collegeInfo?.name?.abbreviation} community
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative border-t border-slate-200/60 dark:border-slate-800/60 py-4">
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center md:text-left font-medium">
              © {currentYear}{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                College Central
              </span>
              . All rights reserved.
            </p>
            <div className="flex items-center gap-3 text-xs">
              <Link
                to="/privacy"
                className="group relative px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-slate-800 overflow-hidden"
              >
                <span className="relative z-10">Privacy Policy</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <Link
                to="/terms"
                className="group relative px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-slate-800 overflow-hidden"
              >
                <span className="relative z-10">Terms of Service</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <a
                href="mailto:collegecentral01@gmail.com"
                className="group relative px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-slate-800 overflow-hidden inline-flex items-center gap-1"
              >
                <span className="relative z-10">Support</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
