'use client';

import { useState } from 'react';
import api from '../lib/api';

interface OnboardingModalProps {
  isOpen: boolean;
  userType: 'client' | 'freelancer';
  onComplete: () => void;
}

export default function OnboardingModal({ isOpen, userType, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Client fields
    company_name: '',
    company_size: '',
    industry: '',
    project_types: [] as string[],
    budget_range: '',
    timeline_preference: '',
    goals: '',
    hear_about_us: '',
    
    // Freelancer fields
    specialization: [] as string[],
    experience_years: '',
    education_level: '',
    work_preference: '',
    availability: '',
    rate_expectation: ''
  });

  const totalSteps = 3;

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCheckboxChange = (field: 'project_types' | 'specialization', value: string) => {
    const currentArray = formData[field];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setFormData({
      ...formData,
      [field]: newArray
    });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        project_types: JSON.stringify(formData.project_types),
        specialization: JSON.stringify(formData.specialization),
        is_completed: true
      };

      await api.post('/onboarding/create/', submitData);
      onComplete();
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await api.post('/onboarding/create/', {
        is_completed: true
      });
      onComplete();
    } catch (error) {
      console.error('Skip onboarding error:', error);
      onComplete(); // Still complete even if API fails
    } finally {
      setLoading(false);
    }
  };

  const renderClientStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Tell us about your company</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
        <input
          type="text"
          name="company_name"
          value={formData.company_name}
          onChange={handleInputChange}
          className="input-field"
          placeholder="Your company name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Size</label>
        <select
          name="company_size"
          value={formData.company_size}
          onChange={handleInputChange}
          className="input-field"
        >
          <option value="">Select company size</option>
          <option value="1-10">1-10 employees</option>
          <option value="11-50">11-50 employees</option>
          <option value="51-200">51-200 employees</option>
          <option value="201-1000">201-1000 employees</option>
          <option value="1000+">1000+ employees</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Industry</label>
        <select
          name="industry"
          value={formData.industry}
          onChange={handleInputChange}
          className="input-field"
        >
          <option value="">Select your industry</option>
          <option value="technology">Technology</option>
          <option value="healthcare">Healthcare</option>
          <option value="finance">Finance</option>
          <option value="retail">Retail</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="education">Education</option>
          <option value="consulting">Consulting</option>
          <option value="startup">Startup</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  );

  const renderClientStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">What type of AI projects do you need help with?</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Project Types (Select all that apply)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { value: 'ai_development', label: 'AI Development' },
            { value: 'data_management', label: 'Data Management' },
            { value: 'ai_ethics', label: 'AI Ethics' },
            { value: 'ai_integration', label: 'AI Integration' },
            { value: 'creative_ai', label: 'Creative AI' },
            { value: 'ai_operations', label: 'AI Operations' }
          ].map((type) => (
            <label key={type.value} className="flex items-center p-2 border border-gray-200 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={formData.project_types.includes(type.value)}
                onChange={() => handleCheckboxChange('project_types', type.value)}
                className="mr-2 text-blue-500"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Typical Project Budget Range</label>
        <select
          name="budget_range"
          value={formData.budget_range}
          onChange={handleInputChange}
          className="input-field"
        >
          <option value="">Select budget range</option>
          <option value="under_1k">Under $1,000</option>
          <option value="1k_5k">$1,000 - $5,000</option>
          <option value="5k_10k">$5,000 - $10,000</option>
          <option value="10k_25k">$10,000 - $25,000</option>
          <option value="25k_50k">$25,000 - $50,000</option>
          <option value="50k_plus">$50,000+</option>
        </select>
      </div>
    </div>
  );

  const renderClientStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Help us personalize your experience</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main AI Goals (Optional)</label>
          <textarea
            name="goals"
            value={formData.goals}
            onChange={handleInputChange}
            rows={3}
            className="input-field text-sm"
            placeholder="e.g., Automate processes, improve analytics..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How did you hear about us?</label>
          <select
            name="hear_about_us"
            value={formData.hear_about_us}
            onChange={handleInputChange}
            className="input-field"
          >
            <option value="">Select an option</option>
            <option value="google">Google Search</option>
            <option value="social_media">Social Media</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">🎯 What&apos;s Next?</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">Browse AI experts, post projects, and get matched with specialists.</p>
      </div>
    </div>
  );

  const renderFreelancerStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">What&apos;s your AI specialization?</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Areas of Expertise (Select all that apply)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { value: 'ai_development', label: 'AI Development' },
            { value: 'data_management', label: 'Data Management' },
            { value: 'ai_ethics', label: 'AI Ethics' },
            { value: 'ai_integration', label: 'AI Integration' },
            { value: 'creative_ai', label: 'Creative AI' },
            { value: 'ai_operations', label: 'AI Operations' }
          ].map((spec) => (
            <label key={spec.value} className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={formData.specialization.includes(spec.value)}
                onChange={() => handleCheckboxChange('specialization', spec.value)}
                className="mr-3 text-green-500 focus:ring-green-500"
              />
              <span className="text-gray-900 dark:text-gray-100">{spec.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Years of AI/ML Experience</label>
        <select
          name="experience_years"
          value={formData.experience_years}
          onChange={handleInputChange}
          className="input-field"
        >
          <option value="">Select experience level</option>
          <option value="0-1">Less than 1 year</option>
          <option value="1-2">1-2 years</option>
          <option value="3-5">3-5 years</option>
          <option value="5-10">5-10 years</option>
          <option value="10+">10+ years</option>
        </select>
      </div>
    </div>
  );

  const renderFreelancerStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Tell us about your work preferences</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Work Style</label>
        <select
          name="work_preference"
          value={formData.work_preference}
          onChange={handleInputChange}
          className="input-field"
        >
          <option value="">Select work preference</option>
          <option value="full_time">Full-time projects (40+ hrs/week)</option>
          <option value="part_time">Part-time projects (20-40 hrs/week)</option>
          <option value="project_based">Project-based work</option>
          <option value="consulting">Consulting & advisory</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expected Hourly Rate (USD)</label>
        <select
          name="rate_expectation"
          value={formData.rate_expectation}
          onChange={handleInputChange}
          className="input-field"
        >
          <option value="">Select rate range</option>
          <option value="under_25">Under $25/hr</option>
          <option value="25_50">$25-50/hr</option>
          <option value="50_75">$50-75/hr</option>
          <option value="75_100">$75-100/hr</option>
          <option value="100_150">$100-150/hr</option>
          <option value="150_plus">$150+/hr</option>
        </select>
      </div>
    </div>
  );

  const renderFreelancerStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Help us personalize your experience</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">What are your career goals? (Optional)</label>
        <textarea
          name="goals"
          value={formData.goals}
          onChange={handleInputChange}
          rows={4}
          className="input-field"
          placeholder="e.g., Build expertise in computer vision, work on cutting-edge AI research, start my own AI consultancy..."
        />
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">🎯 What&apos;s Next?</h3>
        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
          <li>• Complete your profile with portfolio samples</li>
          <li>• Browse available AI projects and submit proposals</li>
          <li>• Get matched with clients in your expertise area</li>
          <li>• Start earning with your AI skills</li>
        </ul>
      </div>
    </div>
  );

  const renderStepContent = () => {
    if (userType === 'client') {
      switch (currentStep) {
        case 1: return renderClientStep1();
        case 2: return renderClientStep2();
        case 3: return renderClientStep3();
        default: return renderClientStep1();
      }
    } else {
      switch (currentStep) {
        case 1: return renderFreelancerStep1();
        case 2: return renderFreelancerStep2();
        case 3: return renderFreelancerStep3();
        default: return renderFreelancerStep1();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6 flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to Neurolancer! {userType === 'client' ? '🎉' : '🚀'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {userType === 'client' 
                ? "Let's set up your client profile to help you find the perfect AI experts"
                : "Let's set up your freelancer profile to help you find amazing AI projects"
              }
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-4 sm:mb-6 flex-shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step < currentStep ? 'bg-green-500 text-white' :
                    step === currentStep ? 'bg-blue-500 text-white' :
                    'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {step < currentStep ? '✓' : step}
                  </div>
                  {step < 3 && <div className="w-8 sm:w-12 h-px bg-gray-300 dark:bg-gray-600 mx-1 sm:mx-2"></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto mb-4 sm:mb-6 min-h-0 custom-scrollbar">
            <div className="pr-2">
              {renderStepContent()}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base ${
                currentStep === 1 
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              ← Previous
            </button>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleSkip}
                disabled={loading}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50 rounded-lg"
              >
                {loading ? 'Skipping...' : 'Skip for now'}
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? 'Completing...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}