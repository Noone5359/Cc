import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // Action buttons
}

/**
 * Reusable page header component with gradient title styling
 * matching the Academic Calendar layout pattern.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && <p className="text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2 md:gap-3">{children}</div>}
    </div>
  );
};

export default PageHeader;
