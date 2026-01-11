import {
  DashboardIcon,
  GradesIcon,
  ScheduleIcon,
  DirectoryIcon,
  ProfileIcon,
  LogoutIcon,
  MapIcon,
  FormsIcon,
  CalendarIcon,
} from '@components/icons/SidebarIcons';
import { useAuth } from '@features/auth/hooks/useAuth';
import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  onHoverChange?: (isHovering: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  onHoverChange,
}) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isHoveringEdge, setIsHoveringEdge] = React.useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Optimized edge hover detection with RAF throttling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isScheduled = false;
    let lastX = -1;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarCollapsed) return;

      // Throttle with requestAnimationFrame for 60fps smoothness
      if (!isScheduled) {
        isScheduled = true;

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          isScheduled = false;
          const x = e.clientX;

          // Skip if mouse hasn't moved significantly
          if (Math.abs(x - lastX) < 2) return;
          lastX = x;

          const edgeDetectionWidth = 40; // Tighter for instant response
          const extendedWidth = 270; // Keep visible area

          const shouldShowSidebar = isHoveringEdge ? x <= extendedWidth : x <= edgeDetectionWidth;

          if (shouldShowSidebar !== isHoveringEdge) {
            // Clear any pending timeout
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }

            // Both show and hide instantly - no delays
            setIsHoveringEdge(shouldShowSidebar);
            onHoverChange?.(shouldShowSidebar);
          }
        });
      }
    };

    if (sidebarCollapsed) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    } else {
      // Reset hover state when sidebar is not collapsed
      if (isHoveringEdge) {
        setIsHoveringEdge(false);
        onHoverChange?.(false);
      }
      return undefined;
    }
  }, [sidebarCollapsed, isHoveringEdge, onHoverChange]);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  const menuSections = {
    academics: [
      { path: '/', icon: <DashboardIcon />, label: 'Dashboard' },
      { path: '/grades', icon: <GradesIcon />, label: 'Grades' },
      { path: '/schedule', icon: <ScheduleIcon />, label: 'Schedule' },
      { path: '/academic-calendar', icon: <CalendarIcon />, label: 'Academic Calendar' },
    ],
    campus: [
      { path: '/directory', icon: <DirectoryIcon />, label: 'Directory' },
      { path: '/campus-map', icon: <MapIcon />, label: 'Campus Map' },
      { path: '/college-forms', icon: <FormsIcon />, label: 'Forms' },
    ],
  };

  const tooltipClasses = `
    absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg
    bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium shadow-xl
    border border-slate-700 dark:border-slate-600
    transition-all duration-150
    invisible opacity-0 group-hover:visible group-hover:opacity-100
    whitespace-nowrap z-50 pointer-events-none
    before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2
    before:border-4 before:border-transparent before:border-r-slate-900 dark:before:border-r-slate-800
    ${!sidebarCollapsed || isHoveringEdge ? 'hidden' : ''}
  `;

  return (
    <>
      <style>{`
        .sidebar-nav::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Edge hover marker for collapsed sidebar */}
      {sidebarCollapsed && (
        <div
          className={`hidden lg:flex fixed top-1/2 -translate-y-1/2 z-50 items-center justify-center w-6 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-r-lg shadow-lg transition-all duration-150 ease-out pointer-events-none ${
            isHoveringEdge && sidebarCollapsed ? 'left-64' : 'left-0'
          }`}
          aria-label="Sidebar marker"
          style={{
            willChange: 'left',
            left: isHoveringEdge ? '16rem' : '0',
          }}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-150 ease-out ${isHoveringEdge ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}

      {/* Sidebar backdrop (mobile) */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      <aside
        ref={sidebar}
        onMouseEnter={() => {
          if (sidebarCollapsed) {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
            setIsHoveringEdge(true);
            onHoverChange?.(true);
          }
        }}
        onMouseLeave={() => {
          // The global mousemove handler will handle hiding the sidebar
          // when the cursor moves beyond the sidebar boundary
        }}
        className={`fixed left-0 top-16 bottom-0 z-50 flex flex-col w-64
          bg-gradient-to-b from-white/95 via-white/95 to-slate-50/95
          dark:from-slate-900/95 dark:via-slate-900/95 dark:to-slate-900/90
          backdrop-blur-xl
          ${sidebarCollapsed && isHoveringEdge ? 'shadow-2xl shadow-blue-500/10' : ''}
          border-r border-slate-200/50 dark:border-slate-700/50
          transition-all overflow-visible duration-150 ease-out
          ${
            // Mobile: Always controlled by sidebarOpen
            sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }
          ${
            // Desktop: Controlled by collapse state and hover
            !sidebarCollapsed
              ? 'lg:translate-x-0'
              : sidebarCollapsed && isHoveringEdge
                ? 'lg:translate-x-0'
                : 'lg:-translate-x-full'
          }
        `}
        style={{
          willChange: sidebarCollapsed ? 'transform' : 'auto',
        }}
      >
        <nav
          className={`sidebar-nav flex flex-col flex-1 px-3 py-4 ${!sidebarCollapsed || isHoveringEdge ? 'overflow-y-auto' : ''}`}
          style={
            !sidebarCollapsed || isHoveringEdge
              ? ({
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                } as React.CSSProperties)
              : {}
          }
        >
          {/* Academics Section */}
          {(!sidebarCollapsed || isHoveringEdge) && (
            <div className="px-3 mb-3 relative">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Academics
                </h3>
              </div>
            </div>
          )}
          <ul className="flex flex-col gap-1.5 mb-6">
            {menuSections.academics.map((item, index) => (
              <li
                key={item.path}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fadeIn"
              >
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `relative group flex items-center gap-3 rounded-xl py-3 font-medium transition-all overflow-hidden ${
                      sidebarCollapsed && !isHoveringEdge ? 'px-3 justify-center' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/40 scale-[1.02] duration-150'
                        : 'text-slate-600 hover:bg-gradient-to-r hover:from-slate-100 hover:to-blue-50 dark:text-slate-300 dark:hover:from-slate-800 dark:hover:to-slate-800/70 hover:scale-[1.01] duration-200'
                    }`
                  }
                  onClick={() => sidebarOpen && setSidebarOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      )}
                      <span className="shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6 relative z-10">
                        {item.icon}
                      </span>
                      <span
                        className={`whitespace-nowrap overflow-hidden transition-all duration-150 relative z-10 ${sidebarCollapsed && !isHoveringEdge ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}
                      >
                        {item.label}
                      </span>
                      {isActive && !sidebarCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      )}
                      <span className={tooltipClasses}>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Campus Section */}
          {(!sidebarCollapsed || isHoveringEdge) && (
            <div className="px-3 mb-3 relative">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-blue-600 rounded-full"></div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Campus Life
                </h3>
              </div>
            </div>
          )}
          <ul className="flex flex-col gap-1.5">
            {menuSections.campus.map((item, index) => (
              <li
                key={item.path}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fadeIn"
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `relative group flex items-center gap-3 rounded-xl py-3 font-medium transition-all overflow-hidden ${
                      sidebarCollapsed && !isHoveringEdge ? 'px-3 justify-center' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/40 scale-[1.02] duration-150'
                        : 'text-slate-600 hover:bg-gradient-to-r hover:from-slate-100 hover:to-blue-50 dark:text-slate-300 dark:hover:from-slate-800 dark:hover:to-slate-800/70 hover:scale-[1.01] duration-200'
                    }`
                  }
                  onClick={() => sidebarOpen && setSidebarOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      )}
                      <span className="shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6 relative z-10">
                        {item.icon}
                      </span>
                      <span
                        className={`whitespace-nowrap overflow-hidden transition-all duration-150 relative z-10 ${sidebarCollapsed && !isHoveringEdge ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}
                      >
                        {item.label}
                      </span>
                      {isActive && !sidebarCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      )}
                      <span className={tooltipClasses}>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Spacer to push bottom actions to the end */}
          <div className="flex-1"></div>

          {/* Bottom actions */}
          <div className="relative border-t border-slate-200/80 dark:border-slate-700/80 pt-3 mt-3">
            {/* Decorative gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

            <ul className="flex flex-col gap-1.5">
              <li>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `relative group flex items-center gap-3 rounded-xl py-3 font-medium transition-all overflow-hidden ${
                      sidebarCollapsed && !isHoveringEdge ? 'px-3 justify-center' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/40 scale-[1.02] duration-150'
                        : 'text-slate-600 hover:bg-gradient-to-r hover:from-slate-100 hover:to-blue-50 dark:text-slate-300 dark:hover:from-slate-800 dark:hover:to-slate-800/70 hover:scale-[1.01] duration-200'
                    }`
                  }
                  onClick={() => sidebarOpen && setSidebarOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      )}
                      <span className="shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6 relative z-10">
                        <ProfileIcon />
                      </span>
                      <span
                        className={`whitespace-nowrap overflow-hidden transition-all duration-150 relative z-10 ${sidebarCollapsed && !isHoveringEdge ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}
                      >
                        Profile
                      </span>
                      {isActive && !sidebarCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      )}
                      <span className={tooltipClasses}>Profile</span>
                    </>
                  )}
                </NavLink>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className={`relative group flex items-center gap-3 w-full rounded-xl py-3 overflow-hidden
                      text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 dark:hover:from-red-900/20 dark:hover:to-red-900/30
                      font-medium transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:shadow-red-500/20 ${
                        sidebarCollapsed && !isHoveringEdge ? 'px-3 justify-center' : 'px-3'
                      }`}
                >
                  <span className="shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6 relative z-10">
                    <LogoutIcon />
                  </span>
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-150 relative z-10 ${sidebarCollapsed && !isHoveringEdge ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}
                  >
                    Logout
                  </span>
                  <span className={tooltipClasses}>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default React.memo(Sidebar);
