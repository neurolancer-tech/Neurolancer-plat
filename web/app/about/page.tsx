"use client";

import Navigation from "@/components/Navigation";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">About Neurolancer</h1>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Neurolancer is an AI-focused freelance marketplace that connects clients with top AI experts
            and engineers around the world. From machine learning and NLP to computer vision, AI integrations,
            and industry-specific AI roles, we help teams build and ship intelligent solutions faster.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">For Clients</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Post jobs, hire vetted AI talent, manage projects securely, and pay with confidence using
                built-in escrow.
              </p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">For Freelancers</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Showcase skills, pass assessments, create gigs, and build your AI portfolio while getting paid on time.
              </p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Trust & Safety</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Verified users, transparent reviews, and dispute resolution ensure a safe environment for collaboration.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

