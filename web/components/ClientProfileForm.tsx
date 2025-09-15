'use client';

import { useState, useEffect } from 'react';
import { ClientProfile, profileApi } from '@/lib/profileApi';
import toast from 'react-hot-toast';

interface ClientProfileFormProps {
  onSave?: (profile: ClientProfile) => void;
}

export default function ClientProfileForm({ onSave }: ClientProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<ClientProfile>>({
    company_name: '',
    company_size: '',
    industry: '',
    company_description: '',
    website_url: '',
    linkedin_url: '',
    project_budget_range: '',
    preferred_project_types: '',
    communication_preferences: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileApi.getClientProfile();
      setProfile(data);
    } catch (error) {
      console.log('No existing client profile found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Submitting client profile:', profile);
      let savedProfile;
      if (profile.id) {
        savedProfile = await profileApi.updateClientProfile(profile);
      } else {
        savedProfile = await profileApi.createClientProfile(profile);
      }
      
      console.log('Saved profile:', savedProfile);
      setProfile(savedProfile);
      toast.success('Client profile saved successfully!');
      onSave?.(savedProfile);
    } catch (error: any) {
      console.error('Error saving client profile:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            name="company_name"
            value={profile.company_name}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Your Company Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Size *
          </label>
          <select
            name="company_size"
            value={profile.company_size}
            onChange={handleChange}
            required
            className="input-field"
          >
            <option value="">Select company size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="501-1000">501-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Industry *
        </label>
        <select
          name="industry"
          value={profile.industry}
          onChange={handleChange}
          required
          className="input-field"
        >
          <option value="">Select industry</option>
          <option value="technology">Technology</option>
          <option value="healthcare">Healthcare</option>
          <option value="finance">Finance</option>
          <option value="education">Education</option>
          <option value="retail">Retail</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="consulting">Consulting</option>
          <option value="media">Media & Entertainment</option>
          <option value="nonprofit">Non-profit</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Company Description *
        </label>
        <textarea
          name="company_description"
          value={profile.company_description}
          onChange={handleChange}
          required
          rows={4}
          className="input-field"
          placeholder="Describe your company and what you do..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project Budget Range *
          </label>
          <select
            name="project_budget_range"
            value={profile.project_budget_range}
            onChange={handleChange}
            required
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Communication Preferences
          </label>
          <select
            name="communication_preferences"
            value={profile.communication_preferences}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Select preference</option>
            <option value="email">Email</option>
            <option value="chat">Chat/Messaging</option>
            <option value="video_calls">Video Calls</option>
            <option value="phone">Phone Calls</option>
            <option value="mixed">Mixed Communication</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preferred Project Types
        </label>
        <textarea
          name="preferred_project_types"
          value={profile.preferred_project_types}
          onChange={handleChange}
          rows={3}
          className="input-field"
          placeholder="Describe the types of AI projects you typically need help with..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Website
          </label>
          <input
            type="url"
            name="website_url"
            value={profile.website_url}
            onChange={handleChange}
            className="input-field"
            placeholder="https://yourcompany.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            LinkedIn Company Page
          </label>
          <input
            type="url"
            name="linkedin_url"
            value={profile.linkedin_url}
            onChange={handleChange}
            className="input-field"
            placeholder="https://linkedin.com/company/yourcompany"
          />
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 transition-all font-medium shadow-lg"
        >
          {loading ? 'Saving...' : 'Save Client Profile'}
        </button>
      </div>
    </form>
  );
}