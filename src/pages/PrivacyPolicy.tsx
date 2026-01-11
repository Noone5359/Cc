import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            <strong>Last Updated:</strong> December 27, 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl p-8 space-y-8">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              College Central ("we," "us," or "our") provides a Progressive Web Application (PWA)
              designed to help students and faculty manage academic life. This Privacy Policy
              explains how we collect, use, and protect your information within our multi-tenant
              platform.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              2. Information We Collect
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              Because College Central uses Google OAuth for authentication, we minimize the amount
              of sensitive personal data stored on our servers.
            </p>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">
              A. Information from Google Account
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              When you sign in using your institutional Google account, we collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>
                <strong>Basic Profile Information:</strong> Name, email address, and profile picture
                URL.
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">
              B. User-Provided Academic Data
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              To provide the app's core functionality, we store data you voluntarily input:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>
                <strong>Academic Records:</strong> Subject names, grades, credits, attendance
                records, and semester details.
              </li>
              <li>
                <strong>Schedules:</strong> Timetable entries, subjects, room numbers, and faculty
                names.
              </li>
              <li>
                <strong>Personalization:</strong> Branch, admission number, and course options.
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">
              C. Automatically Collected Data
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>
                <strong>Activity Logs:</strong> We maintain an audit trail of actions such as
                logins, grade updates, and profile changes to provide a "Recent Activity" feed.
              </li>
              <li>
                <strong>Performance Metrics:</strong> We use Firebase Performance Monitoring and
                Google Analytics to collect anonymous technical data like page load times and
                feature usage.
              </li>
            </ul>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              We use the collected data strictly to provide and improve the College Central
              experience:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>
                <strong>Calculations:</strong> Calculating SGPA/CGPA and tracking attendance.
              </li>
              <li>
                <strong>Organization:</strong> Displaying your personalized class schedule and
                academic calendar.
              </li>
              <li>
                <strong>AI Features:</strong> Providing weather-based recommendations and
                intelligent campus insights via Google Gemini AI.
              </li>
              <li>
                <strong>Security:</strong> Ensuring only authorized users from specific
                institutional domains can access the platform.
              </li>
            </ul>
          </section>

          {/* 4. Data Storage and Security */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              4. Data Storage and Security
            </h2>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              A. Data Isolation (Multi-Tenancy)
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              Your data is stored in a tenant-specific Firebase project. This means your information
              is logically and physically isolated from users of other colleges.
            </p>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">
              B. Security Measures
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>
                <strong>Encryption:</strong> All data is transmitted over HTTPS.
              </li>
              <li>
                <strong>Access Control:</strong> We use Firestore Security Rules to ensure that you
                are the only person who can read or write your personal academic data.
              </li>
              <li>
                <strong>Authentication:</strong> We do not store passwords. Authentication is
                handled entirely through Google's secure OAuth 2.0 system.
              </li>
            </ul>
          </section>

          {/* 5. Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              5. Third-Party Services
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              We integrate with the following providers to deliver our services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>
                <strong>Google Firebase:</strong> For database hosting (Firestore), authentication,
                and file storage.
              </li>
              <li>
                <strong>Google Gemini AI:</strong> For intelligent recommendations.
              </li>
              <li>
                <strong>EmailJS:</strong> For handling support and communication.
              </li>
            </ul>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4 font-medium">
              We do not sell your personal information to third parties.
            </p>
          </section>

          {/* 6. Your Rights and Data Control */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              6. Your Rights and Data Control
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>
                <strong>Access and Update:</strong> You can update your academic records and profile
                information directly within the app.
              </li>
              <li>
                <strong>Data Export:</strong> The platform provides a feature to export your
                activity history and academic data.
              </li>
              <li>
                <strong>Data Deletion:</strong> Since data is user-scoped, you may request the
                deletion of your account and associated subcollections.
              </li>
            </ul>
          </section>

          {/* 7. Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              7. Changes to This Policy
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          {/* 8. Contact Us */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              8. Contact Us
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              If you have questions regarding this Privacy Policy or your data, please contact the
              College Central Development Team via the "Support" section in your app.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-700 dark:text-slate-300">
                Email:{' '}
                <a
                  href="mailto:collegecentral01@gmail.com"
                  className="text-primary hover:text-primary-dark"
                >
                  collegecentral01@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
