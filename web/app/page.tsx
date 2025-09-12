'use client';

import Navigation from '@/components/Navigation';
import { useState } from 'react';

function AIDevCard() {
  const [showModal, setShowModal] = useState(false);

  const subcategories = [
    'Machine Learning Development (classification, regression, clustering)',
    'Deep Learning Models (CNNs, RNNs, Transformers)',
    'Large Language Models (fine-tuning, embeddings, RAG, custom GPTs)',
    'Prompt Engineering (chatbots, generative AI, system prompts)',
    'Natural Language Processing (text summarization, translation, sentiment analysis)',
    'Computer Vision (object detection, OCR, video analysis, AR/VR)',
    'Speech AI (speech-to-text, text-to-speech, speaker recognition)',
    'Reinforcement Learning (game AI, decision-making systems, robotics)',
    'MLOps & AI Infrastructure (deployment pipelines, CI/CD, Docker, Kubernetes)',
    'Edge AI & IoT AI (AI for mobile, embedded systems, smart devices)'
  ];

  return (
    <div className="relative">
      <div 
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 text-center border border-gray-200/50 dark:border-gray-700/50 hover:border-teal-200 dark:hover:border-teal-700 group cursor-pointer"
        onMouseEnter={() => setShowModal(true)}
        onMouseLeave={() => setShowModal(false)}
      >
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🧠</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">AI Development & Engineering</h3>
        <p className="text-gray-600 dark:text-gray-400">ML model building, NLP, computer vision.</p>
      </div>
      
      {showModal && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 max-w-md">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Core technical work in building and deploying AI</h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {subcategories.map((sub, index) => (
              <li key={index} className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span>{sub}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DataModelCard() {
  const [showModal, setShowModal] = useState(false);

  const subcategories = [
    'Data Annotation & Labeling (text, image, audio, video)',
    'Data Cleaning & Preprocessing (feature engineering, outlier handling)',
    'Synthetic Data Generation (simulation, GANs, data augmentation)',
    'Data Visualization & Dashboards (BI tools, custom dashboards)',
    'Model Training (supervised, unsupervised, semi-supervised)',
    'Model Optimization (pruning, quantization, distillation)',
    'Model Monitoring & Evaluation (performance metrics, error analysis)',
    'Data Engineering (ETL pipelines, big data frameworks like Spark)',
    'MLOps for Data (automated retraining, monitoring pipelines)',
    'Cloud AI Setup (AWS Sagemaker, Google Vertex AI, Azure ML)'
  ];

  return (
    <div className="relative">
      <div 
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 text-center border border-gray-200/50 dark:border-gray-700/50 hover:border-teal-200 dark:hover:border-teal-700 group cursor-pointer"
        onMouseEnter={() => setShowModal(true)}
        onMouseLeave={() => setShowModal(false)}
      >
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🗃️</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Data & Model Management</h3>
        <p className="text-gray-600 dark:text-gray-400">Data cleaning, labeling, pipelines, fine-tuning.</p>
      </div>
      
      {showModal && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 max-w-md">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Everything around datasets, training, and optimizing AI models</h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {subcategories.map((sub, index) => (
              <li key={index} className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span>{sub}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AIEthicsCard() {
  const [showModal, setShowModal] = useState(false);

  const subcategories = [
    'Bias & Fairness Audits (dataset bias detection, model bias testing)',
    'Privacy-Preserving AI (federated learning, differential privacy)',
    'AI Compliance (GDPR, HIPAA, EU AI Act, CCPA audits)',
    'Risk Assessment & Safety (AI misuse, red teaming, risk frameworks)',
    'AI Governance Frameworks (internal policies, accountability systems)',
    'Explainable AI (interpretable models, SHAP, LIME, transparency reports)',
    'AI Policy & Strategy Advisory (corporate AI policies, national strategies)',
    'Ethical AI Consulting (human oversight, cultural sensitivity in AI)',
    'Algorithmic Accountability (impact assessments, transparency standards)',
    'Responsible Data Use (data ownership, consent management)'
  ];

  return (
    <div className="relative">
      <div 
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 text-center border border-gray-200/50 dark:border-gray-700/50 hover:border-teal-200 dark:hover:border-teal-700 group cursor-pointer"
        onMouseEnter={() => setShowModal(true)}
        onMouseLeave={() => setShowModal(false)}
      >
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">⚖️</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">AI Ethics, Law & Governance</h3>
        <p className="text-gray-600 dark:text-gray-400">Compliance, bias auditing, responsible AI.</p>
      </div>
      
      {showModal && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 max-w-md">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Responsible AI development, compliance, and regulation</h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {subcategories.map((sub, index) => (
              <li key={index} className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span>{sub}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AIIntegrationCard() {
  const [showModal, setShowModal] = useState(false);

  const subcategories = [
    'Chatbot & Virtual Assistants (customer support, voice assistants)',
    'Workflow Automation (CRM, ERP, marketing automation with AI)',
    'AI API Integration (OpenAI, Anthropic, Hugging Face, custom APIs)',
    'AI in Business Intelligence (AI dashboards, predictive analytics)',
    'AI Product Management (scoping features, building roadmaps)',
    'AI Training & Workshops (staff training, AI bootcamps, corporate enablement)',
    'Customer Support AI (ticket triaging, knowledge base bots)',
    'AI Consulting for SMBs (strategy, adoption, feasibility studies)',
    'Cloud AI Deployment (AWS, Azure, GCP AI solutions)',
    'AI Model Maintenance (bug fixing, retraining, monitoring post-deployment)'
  ];

  return (
    <div className="relative">
      <div 
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 text-center border border-gray-200/50 dark:border-gray-700/50 hover:border-teal-200 dark:hover:border-teal-700 group cursor-pointer"
        onMouseEnter={() => setShowModal(true)}
        onMouseLeave={() => setShowModal(false)}
      >
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🔌</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">AI Integration & Support</h3>
        <p className="text-gray-600 dark:text-gray-400">Chatbot deployment, workflow automation.</p>
      </div>
      
      {showModal && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 max-w-md">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Helping businesses actually use AI in their workflows</h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {subcategories.map((sub, index) => (
              <li key={index} className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span>{sub}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CreativeAICard() {
  const [showModal, setShowModal] = useState(false);

  const subcategories = [
    'AI Content Writing (blogs, ad copy, SEO with AI assistance)',
    'AI Art & Design (digital art, logo design, concept art, 3D renders)',
    'AI in Music & Audio (music composition, mixing, podcast editing)',
    'AI in Video (video generation, VFX, AI-powered editing)',
    'AI in Gaming (NPCs, procedural content generation, dynamic environments)',
    'AI in Healthcare (diagnostic support, medical data analysis, patient triage AI)',
    'AI in Finance (fraud detection, algorithmic trading, risk models)',
    'AI in Education (personalized learning platforms, tutoring bots)',
    'AI in Marketing (ad targeting, customer segmentation, campaign optimization)',
    'AI in Legal & Research (contract analysis, AI legal research assistants)'
  ];

  return (
    <div className="relative">
      <div 
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 text-center border border-gray-200/50 dark:border-gray-700/50 hover:border-teal-200 dark:hover:border-teal-700 group cursor-pointer"
        onMouseEnter={() => setShowModal(true)}
        onMouseLeave={() => setShowModal(false)}
      >
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🎨</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Creative & Industry-Specific AI Roles</h3>
        <p className="text-gray-600 dark:text-gray-400">AI in music, art, design, healthcare, finance.</p>
      </div>
      
      {showModal && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 max-w-md">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Specialized uses of AI in creative industries & verticals</h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {subcategories.map((sub, index) => (
              <li key={index} className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span>{sub}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AIOperationsCard() {
  const [showModal, setShowModal] = useState(false);

  const subcategories = [
    'Digital Twins & Simulation (smart factories, cities, supply chains)',
    'AI for Agriculture (crop monitoring, pest detection, soil health analysis)',
    'AI for Climate & Environment (energy optimization, emissions tracking)',
    'AI in Logistics (demand forecasting, route optimization, fleet AI)',
    'AI Companions & Agents (virtual friends, therapy bots, personal agents)',
    'AI in Retail (recommendation engines, dynamic pricing, inventory prediction)',
    'AI for Government & Policy (public sector AI use, e-governance)',
    'AI in Security & Surveillance (threat detection, anomaly monitoring)',
    'AI in Autonomy & Robotics (self-driving systems, drone oversight, robotics vision)',
    'AI for Developing Economies (local language AI, low-resource models, community solutions)'
  ];

  return (
    <div className="relative">
      <div 
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 text-center border border-gray-200/50 dark:border-gray-700/50 hover:border-teal-200 dark:hover:border-teal-700 group cursor-pointer"
        onMouseEnter={() => setShowModal(true)}
        onMouseLeave={() => setShowModal(false)}
      >
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🌍</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">AI Operations in New Markets</h3>
        <p className="text-gray-600 dark:text-gray-400">AI in agriculture, energy, logistics.</p>
      </div>
      
      {showModal && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 max-w-md">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">AI applied to emerging fields and frontier technologies</h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {subcategories.map((sub, index) => (
              <li key={index} className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span>{sub}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative text-white h-screen flex items-center justify-center overflow-hidden">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/assets/videos/lv_0_20250912131627.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-50 z-10"></div>
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
            <AIDevCard />
            <DataModelCard />
            <AIEthicsCard />
            <AIIntegrationCard />
            <CreativeAICard />
            <AIOperationsCard />
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