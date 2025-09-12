'use client';

import Navigation from '@/components/Navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Hero Section */}
      <section className="text-white py-20 bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Find Top AI Experts & Freelancers
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Connect with skilled professionals specializing in artificial intelligence, 
            machine learning, and cutting-edge technology solutions.
          </p>
          <div className="flex justify-center space-x-4">
            <button onClick={() => window.location.href='/gigs'} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-500 hover:shadow-lg transition-all duration-300">
              Browse Gigs
            </button>
            <button onClick={() => window.location.href='/jobs'} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-green-500 hover:shadow-lg transition-all duration-300">
              Post a Job
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">AI Service Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'AI Development & Engineering', icon: '🧠', description: 'ML model building, NLP, computer vision.' },
              { name: 'Data & Model Management', icon: '🗃️', description: 'Data cleaning, labeling, pipelines, fine-tuning.' },
              { name: 'AI Ethics, Law & Governance', icon: '⚖️', description: 'Compliance, bias auditing, responsible AI.' },
              { name: 'AI Integration & Support', icon: '🔌', description: 'Chatbot deployment, workflow automation.' },
              { name: 'Creative & Industry-Specific AI Roles', icon: '🎨', description: 'AI in music, art, design, healthcare, finance.' },
              { name: 'AI Operations in New Markets', icon: '🌍', description: 'AI in agriculture, energy, logistics.' },
            ].map((category) => (
              <div key={category.name} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 text-center border border-gray-200/50 dark:border-gray-700/50 hover:border-teal-200 dark:hover:border-teal-700 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{category.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">Why Choose Neurolancer?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-teal-600 dark:bg-teal-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Verified Experts</h3>
              <p className="text-gray-600 dark:text-gray-400">All freelancers are vetted and verified for their AI expertise</p>
            </div>
            <div className="text-center">
              <div className="text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-teal-600 dark:bg-teal-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Secure Payments</h3>
              <p className="text-gray-600 dark:text-gray-400">Escrow protection and secure payment processing</p>
            </div>
            <div className="text-center">
              <div className="text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-teal-600 dark:bg-teal-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Fast Delivery</h3>
              <p className="text-gray-600 dark:text-gray-400">Quick turnaround times for your AI projects</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-white py-16 bg-teal-600 dark:bg-teal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8">Join thousands of clients and freelancers in the AI marketplace</p>
          <div className="flex justify-center space-x-4">
            <button onClick={() => window.location.href='/auth?tab=signup'} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-500 hover:shadow-lg transition-all duration-300">
              Join as Freelancer
            </button>
            <button onClick={() => window.location.href='/auth?tab=signup'} className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-yellow-500 hover:shadow-lg transition-all duration-300">
              Hire AI Experts
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}