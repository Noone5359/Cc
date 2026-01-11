// Auth feature hooks

// Context providers
import { AppConfigProvider } from '@contexts/AppConfigContext';

// Layout and common components
import Layout from '@pages/Layout';
import ErrorBoundary from '@components/common/ErrorBoundary';
import ProtectedRoute from '@components/common/ProtectedRoute';
import AdminProtectedRoute from '@components/common/AdminProtectedRoute';
import UpdatePrompt from '@components/common/UpdatePrompt';
import { InstallPrompt } from '@components/common/InstallPrompt';
import { OfflineIndicator } from '@components/common/OfflineIndicator';
import { CalendarProvider } from '@contexts/CalendarContext';
import { CampusMapProvider } from '@contexts/CampusMapContext';
import { FormsProvider } from '@contexts/FormsContext';
import { GradesProvider } from '@contexts/GradesContext';
import { ScheduleProvider } from '@contexts/ScheduleContext';
import { UserProvider } from '@contexts/UserContext';
import { AuthProvider } from '@features/auth/hooks/useAuth';
import { RoleProvider } from '@features/auth/hooks/useRole';

// Utilities
import { lazyWithRetry } from '@lib/utils/lazyWithRetry';
import { measurePageLoad } from '@lib/utils/performance';
import React, { Suspense, useEffect } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';

// Lazy load pages with automatic retry on chunk loading failure
const Dashboard = lazyWithRetry(() => import('@pages/Dashboard'));
const Grades = lazyWithRetry(() => import('@pages/Grades'));
const Schedule = lazyWithRetry(() => import('@pages/Schedule'));
const Directory = lazyWithRetry(() => import('@pages/Directory'));
const Profile = lazyWithRetry(() => import('@pages/Profile'));
const NotFound = lazyWithRetry(() => import('@pages/NotFound'));
const CampusMap = lazyWithRetry(() => import('@pages/CampusMap'));
const CollegeForms = lazyWithRetry(() => import('@pages/CollegeForms'));
const AcademicCalendar = lazyWithRetry(() => import('@pages/AcademicCalendar'));
const Login = lazyWithRetry(() => import('@pages/Login'));
const PrivacyPolicy = lazyWithRetry(() => import('@pages/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('@pages/TermsOfService'));
const OfflinePage = lazyWithRetry(() => import('@pages/OfflinePage'));

// Admin Dashboard - available for admin users in all environments
const AdminDashboard = lazyWithRetry(() => import('@features/admin/AdminDashboard'));
// Auth redirect page for role-based routing
const AuthRedirect = lazyWithRetry(() => import('@pages/AuthRedirect'));

// Loading fallback component
const PageLoader = React.memo(() => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
    </div>
  </div>
));
PageLoader.displayName = 'PageLoader';

const router = createHashRouter([
  // Admin Dashboard routes (protected - requires admin role)
  {
    path: '/admin',
    element: (
      <AdminProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AdminDashboard />
        </Suspense>
      </AdminProtectedRoute>
    ),
    children: [
      { index: true, element: null }, // Default to college-info
      { path: 'college-info', element: null },
      { path: 'branches', element: null },
      { path: 'hostels', element: null },
      { path: 'quick-links', element: null },
      { path: 'quotes', element: null },
      { path: 'forms', element: null },
      { path: 'calendar', element: null },
      { path: 'directory', element: null },
      { path: 'courses', element: null },
      { path: 'students', element: null },
      { path: 'campus-map', element: null },
      { path: 'grading', element: null },
      { path: 'analytics', element: null },
      { path: 'support', element: null },
    ],
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/auth-redirect',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AuthRedirect />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/offline',
    element: (
      <Suspense fallback={<PageLoader />}>
        <OfflinePage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'grades',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Grades />
          </Suspense>
        ),
      },
      {
        path: 'schedule',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Schedule />
          </Suspense>
        ),
      },
      {
        path: 'directory',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Directory />
          </Suspense>
        ),
      },
      {
        path: 'campus-map',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CampusMap />
          </Suspense>
        ),
      },
      {
        path: 'college-forms',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CollegeForms />
          </Suspense>
        ),
      },
      {
        path: 'academic-calendar',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AcademicCalendar />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Profile />
          </Suspense>
        ),
      },
      {
        path: 'privacy',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivacyPolicy />
          </Suspense>
        ),
      },
      {
        path: 'terms',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TermsOfService />
          </Suspense>
        ),
      },

      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
]);

const App: React.FC = () => {
  useEffect(() => {
    // Measure initial app load performance
    measurePageLoad('app_initial_load');
  }, []);

  return (
    <>
      <AuthProvider>
        <AppConfigProvider>
          <UserProvider>
            <RoleProvider>
              <GradesProvider>
                <ScheduleProvider>
                  <CalendarProvider>
                    <FormsProvider>
                      <CampusMapProvider>
                        <RouterProvider router={router} />
                      </CampusMapProvider>
                    </FormsProvider>
                  </CalendarProvider>
                </ScheduleProvider>
              </GradesProvider>
            </RoleProvider>
          </UserProvider>
        </AppConfigProvider>
      </AuthProvider>
      <UpdatePrompt />
      <InstallPrompt />
      <OfflineIndicator />
    </>
  );
};

export default App;
