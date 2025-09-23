'use client';

import Navigation from '@/components/Navigation';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Last updated: January 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By accessing and using Neurolancer, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Platform Services</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Neurolancer provides an AI freelance marketplace connecting clients with AI experts for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>AI service gigs and projects</li>
                <li>Job postings and proposals</li>
                <li>Project management and collaboration</li>
                <li>Learning platform and skill assessments</li>
                <li>Payment processing and escrow services</li>
                <li>Real-time messaging and communication</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. User Accounts</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Users must provide accurate information and maintain account security. You are responsible for all activities under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Payment Terms</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Payments processed through Paystack integration</li>
                <li>Escrow system protects both parties</li>
                <li>Platform fees apply to transactions</li>
                <li>Refunds subject to dispute resolution</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. User Conduct</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">Users agree not to:</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Engage in fraudulent activities</li>
                <li>Harass or abuse other users</li>
                <li>Circumvent platform fees</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Users retain rights to their content. Neurolancer retains rights to platform technology and branding.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Dispute Resolution</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Disputes handled through platform mediation system. Unresolved disputes subject to arbitration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Neurolancer is not liable for indirect damages, service interruptions, or user-generated content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Termination</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Either party may terminate accounts for violations. Data retention subject to privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Terms may be updated with notice. Continued use constitutes acceptance of changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300">
                For questions about these terms, contact us at{' '}
                <a href="mailto:support@neurolancer.work" className="text-[#0D9E86] hover:underline">
                  support@neurolancer.work
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}