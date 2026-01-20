import Footer from '@components/layout/Footer';
import Header from '@components/layout/Header';
import Sidebar from '@components/layout/Sidebar';
import SessionGuard from '@components/common/SessionGuard';
import { useAppConfig } from '@contexts/AppConfigContext';
import { useSidebar } from '@contexts/SidebarContext';
import React, { useEffect } from 'react';
import { useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const Layout: React.FC = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarHovering,
    setSidebarHovering,
  } = useSidebar();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const { config } = useAppConfig();

  // Dynamically update document title and meta tags based on college config
  useEffect(() => {
    const collegeName = config?.collegeInfo?.name?.short || '';
    const fullCollegeName = config?.collegeInfo?.name?.full || collegeName;

    // Update document title
    document.title = collegeName
      ? `College Central - ${collegeName}`
      : 'College Central - Student Portal';

    // Update meta tags dynamically
    const updateMetaTag = (selector: string, content: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      }
    };

    const titleContent = collegeName
      ? `College Central - ${collegeName} Student Portal`
      : 'College Central - Student Portal';

    const descriptionContent = fullCollegeName
      ? `Comprehensive student portal for ${fullCollegeName} - Manage grades, schedules, campus navigation, and academic resources.`
      : 'Comprehensive student portal - Manage grades, schedules, campus navigation, and academic resources.';

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', titleContent);
    updateMetaTag('meta[property="og:description"]', descriptionContent);

    // Update Twitter tags
    updateMetaTag('meta[property="twitter:title"]', titleContent);
    updateMetaTag('meta[property="twitter:description"]', descriptionContent);

    // Update standard meta tags
    updateMetaTag('meta[name="title"]', titleContent);
    updateMetaTag('meta[name="description"]', descriptionContent);
  }, [config?.collegeInfo?.name]);

  // Initialize sidebar state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-collapsed');
      const initialCollapsed = stored !== null ? stored === 'true' : true;
      setSidebarCollapsed(initialCollapsed);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Scroll to top of content when path changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <SessionGuard>
      <div className="flex h-screen overflow-hidden bg-light-bg dark:bg-dark-bg">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          onHoverChange={setSidebarHovering}
        />

        <div
          ref={scrollContainerRef}
          className="relative flex-1 flex flex-col pt-16 overflow-y-auto overflow-x-hidden"
        >
          <div
            className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? (sidebarHovering ? 'lg:pl-64' : 'lg:pl-0') : 'lg:pl-64'}`}
          >
            <main className="flex-1">
              <div className="px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full max-w-9xl mx-auto">
                <Outlet />
              </div>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </SessionGuard>
  );
};

export default Layout;
