'use client';

import { useState, useEffect } from 'react';
import { FreelancerProfile, profileApi } from '@/lib/profileApi';
import toast from 'react-hot-toast';

interface FreelancerProfileFormProps {
  onSave?: (profile: FreelancerProfile) => void;
}

export default function FreelancerProfileForm({ onSave }: FreelancerProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<FreelancerProfile>>({
    title: '',
    bio: '',
    hourly_rate: 0,
    skills: '',
    experience_years: 0,
    education: '',
    certifications: '',
    languages: '',
    portfolio_urls: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
    availability_status: 'available'
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileApi.getFreelancerProfile();
      setProfile(data);
    } catch (error) {
      console.log('No existing freelancer profile found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedProfile;
      if (profile.id) {
        savedProfile = await profileApi.updateFreelancerProfile(profile);
      } else {
        savedProfile = await profileApi.createFreelancerProfile(profile);
      }
      
      setProfile(savedProfile);
      toast.success('Freelancer profile saved successfully!');
      onSave?.(savedProfile);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'hourly_rate' || name === 'experience_years' ? Number(value) : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Professional Title *
          </label>
          <input
            type="text"
            name="title"
            value={profile.title}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Senior AI Engineer, Data Scientist, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hourly Rate ($) *
          </label>
          <input
            type="number"
            name="hourly_rate"
            value={profile.hourly_rate}
            onChange={handleChange}
            required
            min="5"
            step="0.01"
            className="input-field"
            placeholder="50.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Professional Bio *
        </label>
        <textarea
          name="bio"
          value={profile.bio}
          onChange={handleChange}
          required
          rows={4}
          className="input-field"
          placeholder="Describe your expertise and experience..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Skills (comma-separated) *
          </label>
          <input
            type="text"
            name="skills"
            value={profile.skills}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Python, Machine Learning, TensorFlow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Years of Experience *
          </label>
          <input
            type="number"
            name="experience_years"
            value={profile.experience_years}
            onChange={handleChange}
            required
            min="0"
            className="input-field"
            placeholder="5"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Education
        </label>
        <textarea
          name="education"
          value={profile.education}
          onChange={handleChange}
          rows={3}
          className="input-field"
          placeholder="Your educational background..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Certifications
        </label>
        <textarea
          name="certifications"
          value={profile.certifications}
          onChange={handleChange}
          rows={3}
          className="input-field"
          placeholder="Professional certifications..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Languages
          </label>
          <input
            type="text"
            name="languages"
            value={profile.languages}
            onChange={handleChange}
            className="input-field"
            placeholder="English, Spanish, French"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Availability Status
          </label>
          <select
            name="availability_status"
            value={profile.availability_status}
            onChange={handleChange}
            className="input-field"
          >
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Portfolio URLs
          </label>
          <input
            type="url"
            name="portfolio_urls"
            value={profile.portfolio_urls}
            onChange={handleChange}
            className="input-field"
            placeholder="https://portfolio.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            GitHub URL
          </label>
          <input
            type="url"
            name="github_url"
            value={profile.github_url}
            onChange={handleChange}
            className="input-field"
            placeholder="https://github.com/username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            LinkedIn URL
          </label>
          <input
            type="url"
            name="linkedin_url"
            value={profile.linkedin_url}
            onChange={handleChange}
            className="input-field"
            placeholder="https://linkedin.com/in/username"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Website URL
        </label>
        <input
          type="url"
          name="website_url"
          value={profile.website_url}
          onChange={handleChange}
          className="input-field"
          placeholder="https://yourwebsite.com"
        />
      </div>

      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all font-medium shadow-lg"
        >
          {loading ? 'Saving...' : 'Save Freelancer Profile'}
        </button>
      </div>
    </form>
  );
}