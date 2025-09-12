'use client';

import Navigation from '@/components/Navigation';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Last updated: January 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h3>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Name, email address, phone number</li>
                    <li>Profile information and professional documents</li>
                    <li>Payment information (processed securely via Paystack)</li>
                    <li>Identity verification documents</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Platform Data</h3>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Gigs, projects, and service offerings</li>
                    <li>Messages and communications</li>
                    <li>Reviews and ratings</li>
                    <li>Learning progress and assessments</li>
                    <li>Transaction history and earnings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Technical Data</h3>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>IP address, browser type, device information</li>
                    <li>Usage analytics and platform interactions</li>
                    <li>Cookies and session data</li>
                    <li>Error logs and performance metrics</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Provide and improve platform services</li>
                <li>Process payments and transactions</li>
                <li>Facilitate communication between users</li>
                <li>Send notifications and updates</li>
                <li>Prevent fraud and ensure security</li>
                <li>Analyze usage patterns and optimize performance</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Information Sharing</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">We share information only when necessary:</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>With other users as part of platform functionality</li>
                <li>With payment processors (Paystack) for transactions</li>
                <li>With service providers under strict confidentiality</li>
                <li>When required by law or legal process</li>
                <li>To protect rights, property, or safety</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Data Security</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>Secure payment processing via Paystack</li>
                <li>Employee training on data protection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Third-Party Integrations</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">We integrate with:</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Paystack for payment processing</li>
                <li>Google for authentication and calendar</li>
                <li>LinkedIn and GitHub for profile import</li>
                <li>Slack and Zoom for communication</li>
                <li>Analytics services for platform improvement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Your Rights</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
                <li>Control notification preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Cookies and Tracking</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies for authentication, preferences, and analytics. You can control cookie settings in your browser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Data Retention</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We retain data as long as necessary for service provision, legal compliance, and dispute resolution.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. International Transfers</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Data may be processed in different countries with appropriate safeguards in place.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our platform is not intended for users under 18. We do not knowingly collect data from minors.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Policy Updates</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this policy with notice. Continued use constitutes acceptance of changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300">
                For privacy questions or to exercise your rights, contact us at{' '}
                <a href="mailto:neurolancermail@gmail.com" className="text-[#0D9E86] hover:underline">
                  neurolancermail@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}