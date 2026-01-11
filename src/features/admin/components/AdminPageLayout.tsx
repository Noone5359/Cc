import React from 'react';

interface AdminPageLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-full',
};

/**
 * AdminPageLayout - Wraps admin editor pages with consistent layout structure
 *
 * Provides:
 * - Consistent max-width container
 * - Proper vertical spacing between sections
 * - Fade-in animation
 * - Responsive design
 */
const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({ children, maxWidth = '6xl' }) => {
  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
      <div className="space-y-6 sm:space-y-8">{children}</div>
    </div>
  );
};

export default AdminPageLayout;
