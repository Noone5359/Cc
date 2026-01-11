import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfService: React.FC = () => {
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
            Terms of Service
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            <strong>Last Updated:</strong> December 27, 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl p-8 space-y-8">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              By accessing College Central, a Progressive Web Application (PWA), you agree to be
              bound by these Terms of Service.
            </p>
          </section>

          {/* 2. Eligibility & Authentication */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              2. Eligibility & Authentication
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Institutional Access
                </h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Access is restricted to users with a valid institutional email address (e.g.,
                  @iitism.ac.in or other approved tenant domains).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Authentication
                </h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  You must authenticate exclusively via Google OAuth.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Account Responsibility
                </h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  You are responsible for maintaining the security of your Google account as it is
                  the sole gateway to your data.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Use of Services */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              3. Use of Services
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Academic Data
                </h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  The application provides tools for grade tracking and schedule management. While
                  we use weighted averages for CGPA/SGPA calculations, official results are
                  determined solely by the institution's ERP system.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Prohibited Conduct
                </h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                  Users may not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                  <li>Attempt to bypass Firestore Security Rules</li>
                  <li>Access data belonging to other users or tenants</li>
                  <li>Use automated systems to scrape or harvest data</li>
                  <li>Interfere with or disrupt the Service's functionality</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Multi-Tenant Disclaimer */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              4. Multi-Tenant Disclaimer
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              College Central operates as a multi-tenant platform. Each college instance is hosted
              on an isolated Firebase project. We are not responsible for data managed by individual
              college administrators.
            </p>
          </section>

          {/* 5. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              5. Limitation of Liability
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              The service is provided "as is". We do not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Uninterrupted access to the Service</li>
              <li>Availability during network failures or Firebase service outages</li>
              <li>Accuracy of calculated academic metrics</li>
              <li>Data preservation in case of unforeseen technical issues</li>
            </ul>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4">
              To the maximum extent permitted by law, College Central and its developers shall not
              be liable for any indirect, incidental, special, consequential, or punitive damages
              resulting from your use of the Service.
            </p>
          </section>

          {/* Data and Privacy Link */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              6. Data and Privacy
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Your use of College Central is also governed by our{' '}
              <a
                href="/#/privacy-policy"
                className="text-primary hover:text-primary-dark font-medium"
              >
                Privacy Policy
              </a>
              , which explains how we collect, use, and protect your information.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              7. Contact Us
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              If you have any questions about these Terms of Service, please contact us:
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

          {/* Acceptance */}
          <section className="bg-primary/5 dark:bg-primary/10 p-6 rounded-xl">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              By using College Central, you acknowledge that you have read, understood, and agree to
              be bound by these Terms of Service and our Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
