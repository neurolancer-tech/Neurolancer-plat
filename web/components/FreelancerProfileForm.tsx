'use client';

import { useState, useEffect } from 'react';
import { FreelancerProfile, profileApi } from '@/lib/profileApi';
import api from '@/lib/api';
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
    portfolio_url: '',
    github_url: '',
    linkedin_url: '',
    availability: 'freelance'
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<number[]>([]);
  const [primaryCategory, setPrimaryCategory] = useState<number | null>(null);

  useEffect(() => {
    loadProfile();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/with-subcategories/');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
      // Load subcategories for this category
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.subcategories) {
        setSubcategories(prev => [...prev, ...category.subcategories]);
      }
    } else {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
      // Remove subcategories for this category
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.subcategories) {
        const subcategoryIds = category.subcategories.map((sub: any) => sub.id);
        setSelectedSubcategories(selectedSubcategories.filter(id => !subcategoryIds.includes(id)));
        setSubcategories(prev => prev.filter(sub => !subcategoryIds.includes(sub.id)));
      }
    }
  };

  const handleSubcategoryChange = (subcategoryId: number, checked: boolean) => {
    if (checked) {
      setSelectedSubcategories([...selectedSubcategories, subcategoryId]);
    } else {
      setSelectedSubcategories(selectedSubcategories.filter(id => id !== subcategoryId));
    }
  };

  const loadProfile = async () => {
    try {
      const response = await profileApi.getFreelancerProfile();
      if (response && response.id) {
        setProfile(response);
        console.log('Loaded existing freelancer profile:', response);
      }
    } catch (error) {
      console.log('No existing freelancer profile found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Submitting freelancer profile:', profile);
      
      // First save the freelancer profile
      let savedProfile;
      if (profile.id) {
        savedProfile = await profileApi.updateFreelancerProfile(profile);
      } else {
        savedProfile = await profileApi.createFreelancerProfile(profile);
      }
      
      // Then update the user profile with categories and subcategories
      const profileData: any = {};
      if (selectedCategories.length > 0) {
        profileData.category_ids = selectedCategories;
      }
      if (selectedSubcategories.length > 0) {
        profileData.subcategory_ids = selectedSubcategories;
      }
      if (primaryCategory) {
        profileData.primary_category_id = primaryCategory;
      }
      
      if (Object.keys(profileData).length > 0) {
        await api.patch('/profile/update/', profileData);
      }
      
      console.log('Saved profile:', savedProfile);
      setProfile(savedProfile);
      onSave?.(savedProfile);
      toast.success('Freelancer profile saved successfully!');
    } catch (error: any) {
      console.error('Error saving freelancer profile:', error);
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
    setProfile(prev => ({
      ...prev,
      [name]: name === 'hourly_rate' || name === 'experience_years' ? Number(value) : value
    }));
  };

  return (
    <form className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Availability
          </label>
          <select
            name="availability"
            value={profile.availability}
            onChange={handleChange}
            className="input-field"
          >
            <option value="freelance">Freelance</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
          </select>
        </div>
      </div>

      {/* Categories and Subcategories */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Categories & Expertise</h3>
          
          {/* Primary Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Primary Category
            </label>
            <select
              value={primaryCategory || ''}
              onChange={(e) => setPrimaryCategory(e.target.value ? Number(e.target.value) : null)}
              className="input-field"
            >
              <option value="">Select Primary Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon && `${category.icon} `}{category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categories (Select all that apply)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
              {categories.map(category => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {category.icon && `${category.icon} `}{category.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Subcategories */}
          {subcategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Areas of Expertise (Select your specializations)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                {subcategories.map(subcategory => (
                  <label key={subcategory.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSubcategories.includes(subcategory.id)}
                      onChange={(e) => handleSubcategoryChange(subcategory.id, e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {subcategory.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Portfolio URL
          </label>
          <input
            type="url"
            name="portfolio_url"
            value={profile.portfolio_url}
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

      <FreelancerProfileToggle profile={profile} loading={loading} onSubmit={handleSubmit} />
    </form>
  );
}

// Freelancer Profile Toggle Component
function FreelancerProfileToggle({ profile, loading, onSubmit }: {
  profile: Partial<FreelancerProfile>;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    // Reflect actual server state if provided; fall back to false
    setIsPublished(Boolean((profile as any)?.is_active));
  }, [profile]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const newStatus = !isPublished;
      await api.patch('/profile/freelancer/toggle-publish/', {
        is_active: newStatus
      });
      setIsPublished(newStatus);
      toast.success(newStatus ? 'Freelancer profile published!' : 'Freelancer profile unpublished!');
    } catch (error: any) {
      console.error('Toggle publish error:', error.response?.data || error);
      toast.error('Failed to update profile status');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex justify-end pt-6">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isPublished ? 'Profile is live and visible to clients' : 'Profile is not published'}
        </span>
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading || toggling}
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
          {loading || toggling ? 'Processing...' : isPublished ? 'Published' : 'Unpublished'}
        </span>
      </div>
    </div>
  );
}