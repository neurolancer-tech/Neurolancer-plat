'use client';

import { useState, useEffect } from 'react';
import { ClientProfile, profileApi } from '@/lib/profileApi';
import toast from 'react-hot-toast';
import { useEventListener } from '@/lib/useEventListener';

interface ClientProfileFormProps {
  onSave?: (profile: ClientProfile) => void;
}

export default function ClientProfileForm({ onSave }: ClientProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<ClientProfile>>({
    company_name: '',
    company_size: '',
    industry: '',
    website_url: '',
    typical_budget: '',
    project_types: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  // Scroll into view when banner requests profile setup
  useEventListener('open-profile-setup', () => {
    const el = document.querySelector('#profile-setup') as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });

  const loadProfile = async () => {
    try {
      const response = await profileApi.getClientProfile();
      if (response && response.id) {
        setProfile(response);
        console.log('Loaded existing client profile:', response);
      }
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
        toast.success('Client profile updated successfully!');
      } else {
        savedProfile = await profileApi.createClientProfile(profile);
        toast.success('Client profile created successfully!');
      }
      
      console.log('Saved profile:', savedProfile);
      setProfile(savedProfile);
      onSave?.(savedProfile);
    } catch (error: any) {
      console.error('Error saving client profile:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        toast.error('Profile already exists. Loading existing profile...');
        loadProfile();
      } else {
        toast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id="profile-setup">
      {/* Publish Toggle */}
      <ClientPublishToggle />
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
            <option value="500+">500+ employees</option>
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
          Typical Budget Range *
        </label>
        <select
          name="typical_budget"
          value={profile.typical_budget}
          onChange={handleChange}
          required
          className="input-field"
        >
          <option value="">Select budget range</option>
          <option value="under_1k">Under $1,000</option>
          <option value="1k_5k">$1,000 - $5,000</option>
          <option value="5k_10k">$5,000 - $10,000</option>
          <option value="10k_25k">$10,000 - $25,000</option>
          <option value="25k_plus">$25,000+</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Project Types
        </label>
        <textarea
          name="project_types"
          value={profile.project_types}
          onChange={handleChange}
          rows={3}
          className="input-field"
          placeholder="Describe the types of AI projects you typically need help with..."
        />
      </div>

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

function ClientPublishToggle() {
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load current client profile and reflect publish state
    (async () => {
      try {
        const res = await profileApi.getClientProfile();
        setIsPublished(Boolean((res as any)?.is_active !== false));
      } catch (e) {
        // default true
        setIsPublished(true);
      }
    })();
  }, []);

  const togglePublish = async () => {
    setLoading(true);
    try {
      const newState = !isPublished;
      await profileApi.updateClientProfile({ is_active: newState });
      setIsPublished(newState);
      toast.success(newState ? 'Client profile published!' : 'Client profile unpublished!');
    } catch (e: any) {
      toast.error('Failed to update client publish status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isPublished ? 'Profile is live and can open jobs' : 'Profile is not published (jobs will remain closed)'}
        </span>
        <button
          type="button"
          onClick={togglePublish}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
            isPublished ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isPublished ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {loading ? 'Processing...' : isPublished ? 'Published' : 'Unpublished'}
        </span>
      </div>
    </div>
  );
}
