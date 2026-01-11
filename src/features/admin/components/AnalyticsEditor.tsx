import { db } from '@lib/firebase';
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import { AdminHeader, ChartBarIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';

interface UserData {
  id: string;
  name: string;
  email: string;
  branch: string;
  hostel: string;
  year?: string;
  semester?: number;
  courseOption?: 'CBCS' | 'NEP';
  createdAt?: any;
  profilePicture?: string;
  bio?: string;
  bannerGradient?: string;
  profileFrame?: string;

  socialLinks?: Record<string, string>;
  gradesData?: {
    gradeSheetUrl?: string;
  };
}

interface AnalyticsStats {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  profileCompletionRate: number;
  usersWithPhoto: number;
  usersWithBio: number;

  gradesheetsUploaded: number;
  usersWithSocialLinks: number;

  branchDistribution: { name: string; count: number }[];
  yearDistribution: { name: string; count: number }[];
  courseOptionDistribution: { name: string; count: number }[];
  emailDomains: { name: string; count: number }[];
  recentUsers: UserData[];
  allUsers: UserData[];
}

// Vibrant color palette matching admin theme
const CHART_COLORS = [
  '#60a5fa', // blue
  '#a78bfa', // purple
  '#f472b6', // pink
  '#34d399', // emerald
  '#fcd34d', // yellow
  '#fb923c', // orange
  '#22d3ee', // cyan
  '#f87171', // red
  '#a3e635', // lime
  '#e879f9', // fuchsia
];

// Helper function to convert text to Title Case for uniform display
const toTitleCase = (str: string): string => {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Icons
const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const TrendUpIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const UserCheckIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const AnalyticsEditor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<{ title: string; users: UserData[] } | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const usersPerPage = 10;

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const usersSnapshot = await db.collection('users').get();
      const users: UserData[] = [];

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          name: data.name || data.fullName || 'Unknown',
          email: data.email || '',
          branch: data.branch || 'Unknown',
          hostel: data.hostel || 'Unknown',
          year: data.year,
          semester: data.semester,
          courseOption: data.courseOption,
          createdAt: data.createdAt,
          profilePicture: data.profilePicture,
          bio: data.bio,
          bannerGradient: data.bannerGradient,
          profileFrame: data.profileFrame,
          socialLinks: data.socialLinks,
          gradesData: data.gradesData,
        });
      });

      // Get current date info
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate engagement metrics
      let newThisWeek = 0;
      let newThisMonth = 0;
      let usersWithPhoto = 0;
      let usersWithBio = 0;

      let gradesheetsUploaded = 0;
      let usersWithSocialLinks = 0;

      const branchCounts: Record<string, number> = {};
      const yearCounts: Record<string, number> = {};
      const courseOptionCounts: Record<string, number> = { CBCS: 0, NEP: 0 };
      const emailDomainCounts: Record<string, number> = {};

      users.forEach((user) => {
        // Parse createdAt
        let createdDate: Date | null = null;
        if (user.createdAt) {
          try {
            createdDate = user.createdAt.toDate?.() || new Date(user.createdAt.seconds * 1000);
          } catch {
            createdDate = null;
          }
        }

        // New users metrics
        if (createdDate) {
          if (createdDate >= oneWeekAgo) newThisWeek++;
          if (createdDate >= oneMonthAgo) newThisMonth++;
        }

        // Profile completion
        if (user.profilePicture) usersWithPhoto++;
        if (user.bio && user.bio.trim().length > 0) usersWithBio++;
        if (user.gradesData?.gradeSheetUrl) {
          gradesheetsUploaded++;
        }
        if (user.socialLinks && Object.keys(user.socialLinks).length > 0) {
          usersWithSocialLinks++;
        }

        // Branch - normalize to Title Case for uniform display
        const normalizedBranch = toTitleCase(user.branch);
        branchCounts[normalizedBranch] = (branchCounts[normalizedBranch] || 0) + 1;

        // Admission Year - extract from email prefix (e.g., 23JE0653 → 2023)
        if (user.email) {
          const emailPrefix = user.email.split('@')[0] || '';
          const match = emailPrefix.match(/^(\d{2})/);
          if (match && match[1]) {
            const yearNum = parseInt(match[1], 10);
            // Convert 2-digit year to full year (23 → 2023, 24 → 2024)
            const fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
            const yearLabel = String(fullYear);
            yearCounts[yearLabel] = (yearCounts[yearLabel] || 0) + 1;
          } else {
            yearCounts['Other'] = (yearCounts['Other'] || 0) + 1;
          }
        } else {
          yearCounts['Other'] = (yearCounts['Other'] || 0) + 1;
        }

        // Course option
        if (user.courseOption === 'CBCS') {
          courseOptionCounts['CBCS'] = (courseOptionCounts['CBCS'] || 0) + 1;
        } else if (user.courseOption === 'NEP') {
          courseOptionCounts['NEP'] = (courseOptionCounts['NEP'] || 0) + 1;
        }

        // Email domain
        if (user.email && user.email.includes('@')) {
          const domain = user.email.split('@')[1] || 'Unknown';
          emailDomainCounts[domain] = (emailDomainCounts[domain] || 0) + 1;
        }
      });

      // Profile completion rate (has photo + has bio)
      const profileComplete = users.filter(
        (u) => u.profilePicture && u.bio && u.bio.trim().length > 0
      ).length;
      const profileCompletionRate =
        users.length > 0 ? Math.round((profileComplete / users.length) * 100) : 0;

      // Sort users by createdAt for recent list
      const sortedUsers = [...users].sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return bTime - aTime;
      });

      setStats({
        totalUsers: users.length,
        newUsersThisWeek: newThisWeek,
        newUsersThisMonth: newThisMonth,
        profileCompletionRate,
        usersWithPhoto,
        usersWithBio,

        gradesheetsUploaded,
        usersWithSocialLinks,

        branchDistribution: Object.entries(branchCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        yearDistribution: Object.entries(yearCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => {
            // Sort batches by year (Batch 2021, Batch 2022, etc.)
            const aYear = parseInt(a.name.replace(/\D/g, '')) || 0;
            const bYear = parseInt(b.name.replace(/\D/g, '')) || 0;
            return aYear - bYear;
          }),
        courseOptionDistribution: Object.entries(courseOptionCounts)
          .filter(([, count]) => count > 0)
          .map(([name, count]) => ({ name, count })),
        emailDomains: Object.entries(emailDomainCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        recentUsers: sortedUsers.slice(0, 8),
        allUsers: users,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate?.() || new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  // Filter functions for engagement metrics
  const filterByProfilePhoto = () => {
    if (!stats) return;
    const filtered = stats.allUsers.filter((u) => u.profilePicture);
    setSelectedFilter({ title: 'Users with Profile Photo', users: filtered });
  };

  const filterByBio = () => {
    if (!stats) return;
    const filtered = stats.allUsers.filter((u) => u.bio && u.bio.trim().length > 0);
    setSelectedFilter({ title: 'Users with Bio', users: filtered });
  };

  const filterByGradesheets = () => {
    if (!stats) return;
    const filtered = stats.allUsers.filter((u) => u.gradesData?.gradeSheetUrl);
    setSelectedFilter({ title: 'Users with Uploaded Gradesheets', users: filtered });
  };

  const filterBySocialLinks = () => {
    if (!stats) return;
    const filtered = stats.allUsers.filter(
      (u) => u.socialLinks && Object.keys(u.socialLinks).length > 0
    );
    setSelectedFilter({ title: 'Users with Social Links', users: filtered });
  };

  const closeModal = () => setSelectedFilter(null);

  // Filter functions for charts
  const filterByBranch = (branchName: string) => {
    if (!stats) return;
    if (branchName === 'Other') {
      // Get the exact branches shown in top 5 of the chart (normalized for comparison)
      const top5BranchNames = new Set(
        stats.branchDistribution.slice(0, 5).map((b) => (b.name || '').trim().toLowerCase())
      );
      // Filter users whose branch is NOT in top 5
      const filtered = stats.allUsers.filter((u) => {
        const userBranch = (u.branch || '').trim().toLowerCase();
        return !top5BranchNames.has(userBranch);
      });
      setSelectedFilter({ title: 'Users in Other Branches', users: filtered });
    } else {
      // Normalize comparison for exact match
      const normalizedSearch = branchName.trim().toLowerCase();
      const filtered = stats.allUsers.filter(
        (u) => (u.branch || '').trim().toLowerCase() === normalizedSearch
      );
      setSelectedFilter({ title: `Users in ${branchName}`, users: filtered });
    }
  };

  const filterByYear = (year: string) => {
    if (!stats) return;
    const filtered = stats.allUsers.filter((u) => {
      if (!u.email) return year === 'Other';
      const prefix = u.email.split('@')[0] || '';
      const match = prefix.match(/^(\d{2})/);
      if (match && match[1]) {
        const yearNum = parseInt(match[1], 10);
        const fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
        return String(fullYear) === year;
      }
      return year === 'Other';
    });
    setSelectedFilter({ title: `Users from ${year}`, users: filtered });
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await db.collection('users').doc(userToDelete.id).delete();
      setUserToDelete(null);
      // Refresh analytics after deletion
      await fetchAnalytics();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-indigo-300">Loading user analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card bg-red-500/10 border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-medium">Failed to load analytics</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
        <button onClick={fetchAnalytics} className="admin-btn admin-btn-secondary mt-4">
          <RefreshIcon /> Try Again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <AdminPageLayout>
      {/* Header */}
      <AdminHeader
        icon={<ChartBarIcon />}
        title="User Analytics"
        subtitle={lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
      >
        <button
          onClick={fetchAnalytics}
          className="admin-btn admin-btn-secondary text-xs sm:text-sm"
        >
          <RefreshIcon />
          <span className="hidden xs:inline">Refresh</span>
        </button>
      </AdminHeader>

      {/* Key Metrics - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="admin-stat-card p-3 sm:p-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 text-blue-400">
            <UsersIcon />
          </div>
          <div className="admin-stat-value text-xl sm:text-3xl">{stats.totalUsers}</div>
          <div className="admin-stat-label text-xs">Total Users</div>
        </div>
        <div className="admin-stat-card p-3 sm:p-6">
          <div className="flex items-center justify-center gap-2 mb-2 text-emerald-400">
            <TrendUpIcon />
          </div>
          <div className="admin-stat-value text-xl sm:text-3xl text-emerald-400">
            +{stats.newUsersThisWeek}
          </div>
          <div className="admin-stat-label text-xs">This Week</div>
        </div>
        <div className="admin-stat-card p-3 sm:p-6">
          <div className="flex items-center justify-center gap-2 mb-2 text-cyan-400">
            <CalendarIcon />
          </div>
          <div className="admin-stat-value text-xl sm:text-3xl text-cyan-400">
            +{stats.newUsersThisMonth}
          </div>
          <div className="admin-stat-label text-xs">This Month</div>
        </div>
        <div className="admin-stat-card p-3 sm:p-6">
          <div className="flex items-center justify-center gap-2 mb-2 text-purple-400">
            <UserCheckIcon />
          </div>
          <div className="admin-stat-value text-xl sm:text-3xl text-purple-400">
            {stats.profileCompletionRate}%
          </div>
          <div className="admin-stat-label text-xs">Profile Completion</div>
        </div>
      </div>

      {/* Engagement Metrics - Row 2 (Clickable) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div
          className="admin-card p-3 sm:p-4 text-center cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all"
          onClick={filterByProfilePhoto}
        >
          <div className="text-xl sm:text-3xl font-bold text-purple-400">
            {stats.usersWithPhoto}
          </div>
          <div className="text-xs sm:text-sm text-indigo-400 mt-1">Profile Photo</div>
          <div className="text-xs text-indigo-500">
            {stats.totalUsers > 0 ? Math.round((stats.usersWithPhoto / stats.totalUsers) * 100) : 0}
            %
          </div>
        </div>
        <div
          className="admin-card p-3 sm:p-4 text-center cursor-pointer hover:ring-2 hover:ring-pink-500/50 transition-all"
          onClick={filterByBio}
        >
          <div className="text-xl sm:text-3xl font-bold text-pink-400">{stats.usersWithBio}</div>
          <div className="text-xs sm:text-sm text-indigo-400 mt-1">Bio Written</div>
          <div className="text-xs text-indigo-500">
            {stats.totalUsers > 0 ? Math.round((stats.usersWithBio / stats.totalUsers) * 100) : 0}%
          </div>
        </div>
        <div
          className="admin-card p-3 sm:p-4 text-center cursor-pointer hover:ring-2 hover:ring-cyan-500/50 transition-all"
          onClick={filterByGradesheets}
        >
          <div className="text-xl sm:text-3xl font-bold text-cyan-400">
            {stats.gradesheetsUploaded}
          </div>
          <div className="text-xs sm:text-sm text-indigo-400 mt-1">Gradesheets</div>
          <div className="text-xs text-indigo-500">
            {stats.totalUsers > 0
              ? Math.round((stats.gradesheetsUploaded / stats.totalUsers) * 100)
              : 0}
            %
          </div>
        </div>
        <div
          className="admin-card p-3 sm:p-4 text-center cursor-pointer hover:ring-2 hover:ring-emerald-500/50 transition-all"
          onClick={filterBySocialLinks}
        >
          <div className="text-xl sm:text-3xl font-bold text-emerald-400">
            {stats.usersWithSocialLinks}
          </div>
          <div className="text-xs sm:text-sm text-indigo-400 mt-1">Social Links</div>
          <div className="text-xs text-indigo-500">
            {stats.totalUsers > 0
              ? Math.round((stats.usersWithSocialLinks / stats.totalUsers) * 100)
              : 0}
            %
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Branch Distribution */}
        <div className="admin-card">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Users by Branch</h3>
          {stats.branchDistribution.length > 0 ? (
            <div style={{ width: '100%', minHeight: 280 }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={(() => {
                    const top5 = stats.branchDistribution.slice(0, 5);
                    const otherCount = stats.branchDistribution
                      .slice(5)
                      .reduce((sum, b) => sum + b.count, 0);
                    if (otherCount > 0) {
                      return [...top5, { name: 'Other', count: otherCount }];
                    }
                    return top5;
                  })()}
                  layout="vertical"
                >
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    width={130}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#branchGradient)"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(data) => data.name && filterByBranch(data.name)}
                  />
                  <defs>
                    <linearGradient id="branchGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-indigo-400 text-center py-8">No branch data available</p>
          )}
        </div>

        {/* Year Distribution */}
        <div className="admin-card">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
            Users by Admission Year
          </h3>
          {stats.yearDistribution.length > 0 ? (
            <div style={{ width: '100%', minHeight: 280 }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.yearDistribution} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    width={60}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#yearGradient)"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(data) => data.name && filterByYear(data.name)}
                  />
                  <defs>
                    <linearGradient id="yearGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-indigo-400 text-center py-8">No year data available</p>
          )}
        </div>
      </div>

      {/* User Growth Chart - Full Width */}
      <div className="admin-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            User Growth (Last 30 Days)
          </h3>
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-indigo-300">Cumulative Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-indigo-300">Daily Signups</span>
            </div>
          </div>
        </div>
        {(() => {
          // Generate data for last 30 days
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          // Create a map of dates to signup counts
          const signupsByDate: Record<string, number> = {};

          // Initialize all dates with 0
          for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            signupsByDate[dateKey] = 0;
          }

          // Count signups per day
          stats.allUsers.forEach((user) => {
            if (user.createdAt) {
              const createdDate = user.createdAt?.toDate
                ? user.createdAt.toDate()
                : new Date(user.createdAt.seconds * 1000);
              if (createdDate >= thirtyDaysAgo && createdDate <= now) {
                const dateKey = createdDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                if (signupsByDate[dateKey] !== undefined) {
                  signupsByDate[dateKey]++;
                }
              }
            }
          });

          // Create cumulative growth data
          let cumulativeTotal =
            stats.totalUsers - Object.values(signupsByDate).reduce((a, b) => a + b, 0);
          const growthData = Object.entries(signupsByDate).map(([date, count]) => {
            cumulativeTotal += count;
            return {
              date,
              signups: count,
              total: cumulativeTotal,
            };
          });

          const hasData = growthData.some((d) => d.signups > 0);
          const maxSignups = Math.max(...growthData.map((d) => d.signups), 1);

          return hasData ? (
            <div style={{ width: '100%', minHeight: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={growthData} margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
                  <defs>
                    <linearGradient id="growthLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                    <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#a78bfa" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.15)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={{ stroke: '#475569' }}
                    axisLine={{ stroke: '#475569' }}
                    interval="preserveStartEnd"
                    tickFormatter={(value, index) => (index % 5 === 0 ? value : '')}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#475569"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#22d3ee' }}
                    tickLine={{ stroke: '#475569' }}
                    axisLine={{ stroke: '#475569' }}
                    width={45}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#34d399"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#34d399' }}
                    tickLine={{ stroke: '#475569' }}
                    axisLine={{ stroke: '#475569' }}
                    domain={[0, Math.max(maxSignups * 2, 5)]}
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(96, 165, 250, 0.4)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      padding: '12px 16px',
                    }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}
                    cursor={{ stroke: 'rgba(148, 163, 184, 0.3)', strokeWidth: 1 }}
                    formatter={(value, name) => {
                      const numValue = value ?? 0;
                      const strName = name ?? '';
                      if (strName === 'total')
                        return [`${Number(numValue).toLocaleString()} users`, 'Total Users'];
                      return [`+${numValue} ${numValue === 1 ? 'signup' : 'signups'}`, 'New Today'];
                    }}
                    animationDuration={200}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="total"
                    stroke="none"
                    fill="url(#growthAreaGradient)"
                    animationDuration={1500}
                    animationEasing="ease-out"
                    legendType="none"
                    tooltipType="none"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="signups"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={{ fill: '#34d399', strokeWidth: 0, r: 3 }}
                    activeDot={{
                      fill: '#10b981',
                      strokeWidth: 3,
                      stroke: 'rgba(52, 211, 153, 0.3)',
                      r: 6,
                      style: { filter: 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.5))' },
                    }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="total"
                    stroke="#22d3ee"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      fill: '#22d3ee',
                      strokeWidth: 3,
                      stroke: 'rgba(34, 211, 238, 0.3)',
                      r: 8,
                      style: { filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))' },
                    }}
                    animationDuration={2000}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-indigo-400 text-center py-8">
              No recent signups in the last 30 days
            </p>
          );
        })()}
      </div>

      {/* All Users - Paginated */}
      <div className="admin-card">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-semibold text-white">All Users</h3>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder-indigo-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Branches</option>
              {stats.branchDistribution.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {stats.yearDistribution.map((y) => (
                <option key={y.name} value={y.name}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(() => {
          // Apply filters
          const filteredUsers = stats.allUsers
            .filter((user) => {
              // Search filter
              if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (
                  !user.name.toLowerCase().includes(query) &&
                  !user.email.toLowerCase().includes(query)
                ) {
                  return false;
                }
              }
              // Branch filter - use case-insensitive comparison to match chart grouping
              if (
                branchFilter !== 'all' &&
                user.branch.toLowerCase() !== branchFilter.toLowerCase()
              ) {
                return false;
              }
              // Year filter
              if (yearFilter !== 'all') {
                if (!user.email) return yearFilter === 'Other';
                const prefix = user.email.split('@')[0] || '';
                const match = prefix.match(/^(\d{2})/);
                if (match && match[1]) {
                  const yearNum = parseInt(match[1], 10);
                  const fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
                  if (String(fullYear) !== yearFilter && yearFilter !== 'Other') return false;
                } else if (yearFilter !== 'Other') {
                  return false;
                }
              }
              return true;
            })
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
              const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
              return bTime - aTime;
            });

          const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
          const paginatedUsers = filteredUsers.slice(
            (currentPage - 1) * usersPerPage,
            currentPage * usersPerPage
          );

          return filteredUsers.length > 0 ? (
            <>
              <div className="text-xs sm:text-sm text-indigo-400 mb-3">
                Showing {(currentPage - 1) * usersPerPage + 1}-
                {Math.min(currentPage * usersPerPage, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
                {(searchQuery || branchFilter !== 'all' || yearFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setBranchFilter('all');
                      setYearFilter('all');
                    }}
                    className="ml-2 text-blue-400 hover:text-blue-300"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {paginatedUsers.map((user, index) => (
                  <div key={user.id} className="admin-list-item flex items-center gap-3 sm:gap-4">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0 text-sm sm:text-base"
                      style={{
                        backgroundColor:
                          CHART_COLORS[
                            (index + (currentPage - 1) * usersPerPage) % CHART_COLORS.length
                          ],
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate text-sm sm:text-base">
                        {user.name}
                      </p>
                      <p className="text-indigo-400 text-xs sm:text-sm truncate">{user.email}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-indigo-300 text-sm">{user.branch}</p>
                      <p className="text-indigo-500 text-xs">{formatDate(user.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => setUserToDelete(user)}
                      className="p-1.5 sm:p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Remove user"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 pt-4 border-t border-slate-700">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="admin-btn admin-btn-secondary text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1 sm:gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="admin-btn admin-btn-secondary text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <p className="text-indigo-400 text-center py-8">
              {searchQuery || branchFilter !== 'all' || yearFilter !== 'all'
                ? 'No users match your filters'
                : 'No registered users yet'}
            </p>
          );
        })()}
      </div>

      {/* Users Modal */}
      {selectedFilter && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="admin-card max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedFilter.title}</h3>
                <p className="text-indigo-400 text-sm">{selectedFilter.users.length} users</p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] space-y-2">
              {selectedFilter.users.map((user, index) => (
                <div key={user.id} className="admin-list-item flex items-center gap-3 p-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user.name}</p>
                    <p className="text-indigo-400 text-sm truncate">{user.email}</p>
                  </div>
                  <div className="text-right text-sm hidden sm:block">
                    <p className="text-indigo-300">{user.branch}</p>
                  </div>
                </div>
              ))}
              {selectedFilter.users.length === 0 && (
                <p className="text-indigo-400 text-center py-8">No users found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !deleting && setUserToDelete(null)}
        >
          <div className="admin-card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Remove User?</h3>
              <p className="text-indigo-300 mb-6">
                Are you sure you want to remove{' '}
                <span className="font-semibold text-white">{userToDelete.name}</span>?
                <br />
                <span className="text-sm text-indigo-400">{userToDelete.email}</span>
              </p>
              <p className="text-red-400 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setUserToDelete(null)}
                  disabled={deleting}
                  className="admin-btn admin-btn-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AnalyticsEditor;
