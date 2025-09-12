'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I create an account on Neurolancer?',
        a: 'Click "Sign Up" and choose between Client or Freelancer account. Complete the registration form and verify your email to get started.'
      },
      {
        q: 'What types of AI services are available?',
        a: 'We offer Machine Learning, Computer Vision, Natural Language Processing, Data Science, AI Automation, and AI Security services.'
      },
      {
        q: 'How do I find the right AI expert for my project?',
        a: 'Use our search filters to browse by category, skills, rating, and budget. Review portfolios and ratings to make an informed choice.'
      }
    ]
  },
  {
    category: 'For Clients',
    questions: [
      {
        q: 'How do I post a project?',
        a: 'Go to "Post Job" from your dashboard, describe your project requirements, set your budget, and publish to receive proposals from AI experts.'
      },
      {
        q: 'How does payment work?',
        a: 'Payments are processed securely through our platform. Funds are held in escrow and released when you approve the completed work.'
      },
      {
        q: 'What if I\'m not satisfied with the work?',
        a: 'We offer dispute resolution and revision requests. Contact our support team if you need assistance resolving any issues.'
      }
    ]
  },
  {
    category: 'For Freelancers',
    questions: [
      {
        q: 'How do I create a compelling profile?',
        a: 'Add a professional photo, detailed bio, showcase your AI expertise, upload portfolio samples, and highlight your specializations.'
      },
      {
        q: 'How do I set my rates?',
        a: 'Research market rates for your skills, consider your experience level, and set competitive hourly or project-based rates.'
      },
      {
        q: 'When do I get paid?',
        a: 'Payments are released after client approval of deliverables. Funds typically arrive in your account within 2-5 business days.'
      }
    ]
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      faq => 
        faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Find answers to common questions about Neurolancer</p>
        </div>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="space-y-8">
          {filteredFaqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="bg-[#0D9E86] px-6 py-4">
                <h2 className="text-xl font-bold text-white">{category.category}</h2>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {category.questions.map((faq, faqIndex) => {
                  const itemId = `${categoryIndex}-${faqIndex}`;
                  const isOpen = openItems.includes(itemId);
                  
                  return (
                    <div key={faqIndex}>
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white pr-4">{faq.q}</h3>
                          <svg
                            className={`w-5 h-5 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-[#0D9E86] to-teal-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
            <p className="mb-6">Our support team is here to help you succeed on Neurolancer.</p>
            <a
              href="/contact"
              className="inline-flex items-center bg-white text-[#0D9E86] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Support
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}