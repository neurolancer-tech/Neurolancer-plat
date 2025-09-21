'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Category, Subcategory } from '@/types';
import { useSubcategories } from '../../hooks/useSubcategories';
import { isAuthenticated, getProfile } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';


export default function CreateGigPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategories: [] as string[],
    tags: '',
    basic_title: '',
    basic_description: '',
    basic_price: '',
    basic_delivery_time: '',
    standard_title: '',
    standard_description: '',
    standard_price: '',
    standard_delivery_time: '',
    premium_title: '',
    premium_description: '',
    premium_price: '',
    premium_delivery_time: ''
  });

  // Image selection state
  const [imageOption, setImageOption] = useState<'none' | 'upload' | 'url'>('none');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const profile = getProfile();
    if (profile && profile.user_type !== 'freelancer' && profile.user_type !== 'both') {
      toast.error('Only freelancers can create gigs');
      router.push('/dashboard');
      return;
    }

    loadCategories();
  }, [router]);

  // Use the subcategories hook
  const { subcategories, loading: subcategoriesLoading } = useSubcategories(formData.category);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/');
      const categoriesData = response.data.results || response.data;
      console.log('Loaded categories:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      // Clear subcategories when category changes
      ...(name === 'category' && { subcategories: [] })
    });
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    const updatedSubcategories = formData.subcategories.includes(subcategoryId)
      ? formData.subcategories.filter(id => id !== subcategoryId)
      : [...formData.subcategories, subcategoryId];
    
    setFormData({
      ...formData,
      subcategories: updatedSubcategories
    });
  };

  const handleImageOptionChange = (option: 'none' | 'upload' | 'url') => {
    setImageOption(option);
    setImageFile(null);
    setImageUrl('');
    setImagePreview(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setImagePreview(url || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Add form fields explicitly to avoid conflicts
      const fieldsToSubmit = [
        'title', 'description', 'tags',
        'basic_title', 'basic_description', 'basic_price', 'basic_delivery_time',
        'standard_title', 'standard_description', 'standard_price', 'standard_delivery_time',
        'premium_title', 'premium_description', 'premium_price', 'premium_delivery_time'
      ];
      
      fieldsToSubmit.forEach(field => {
        const value = formData[field as keyof typeof formData];
        if (value !== '' && value !== null && value !== undefined) {
          submitData.append(field, value as string);
        }
      });
      
      // Add category_id
      if (formData.category) {
        submitData.append('category_id', formData.category);
      }
      
      // Add subcategories
      if (formData.subcategories.length > 0) {
        formData.subcategories.forEach(subId => {
          submitData.append('subcategory_ids', subId);
        });
      }
      
      // Add image based on selection - be very explicit
      if (imageOption === 'upload' && imageFile) {
        submitData.append('image', imageFile);
      } else if (imageOption === 'url' && imageUrl.trim()) {
        submitData.append('image_url', imageUrl.trim());
      }
      // For 'none' option, don't add any image fields
      
      // Debug: Log what we're sending
      console.log('FormData entries:');
      for (let [key, value] of submitData.entries()) {
        console.log(key, value);
      }
      
      const response = await api.post('/gigs/create/', submitData);
      const myProfile = getProfile();
      const wasForcedInactive = response.data && response.data.is_active === false;
      toast.success(`Gig created successfully${wasForcedInactive ? ' (saved as Inactive because your freelancer profile is unpublished)' : ''}!`);
      if (wasForcedInactive && myProfile) {
        toast.error('Publish your freelancer profile to activate this gig. Go to Profile Setup > Publish.');
      }
      router.push('/my-gigs');
    } catch (error: any) {
      console.error('Gig creation error:', error.response?.data);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to create gig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create a New Gig</h1>
          <p className="text-gray-600 dark:text-gray-400">Showcase your AI expertise and attract clients</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gig Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="I will create an AI chatbot for your business"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subcategories */}
            {formData.category && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subcategories (Select relevant ones)
                </label>
                {subcategoriesLoading ? (
                  <div className="text-sm text-gray-500">Loading subcategories...</div>
                ) : subcategories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3">
                    {subcategories.map(sub => (
                      <label key={sub.id} className="flex items-start space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.subcategories.includes(sub.id.toString())}
                          onChange={() => handleSubcategoryChange(sub.id.toString())}
                          className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{sub.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No subcategories available for this category.</div>
                )}
              </div>
            )}

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Describe your service in detail..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="input-field"
                placeholder="AI, Machine Learning, Python, TensorFlow"
              />
            </div>

            {/* Image Selection */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gig Image
              </label>
              
              <div className="space-y-4">
                {/* Image Options */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="imageOption"
                      value="none"
                      checked={imageOption === 'none'}
                      onChange={() => handleImageOptionChange('none')}
                      className="mr-2"
                    />
                    Use default image
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="imageOption"
                      value="upload"
                      checked={imageOption === 'upload'}
                      onChange={() => handleImageOptionChange('upload')}
                      className="mr-2"
                    />
                    Upload image
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="imageOption"
                      value="url"
                      checked={imageOption === 'url'}
                      onChange={() => handleImageOptionChange('url')}
                      className="mr-2"
                    />
                    Image URL
                  </label>
                </div>

                {/* File Upload */}
                {imageOption === 'upload' && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="input-field"
                    />
                  </div>
                )}

                {/* URL Input */}
                {imageOption === 'url' && (
                  <div>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      className="input-field"
                    />
                  </div>
                )}

                {/* Image Preview */}
                <div className="mt-4">
                  <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => setImagePreview('/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg')}
                      />
                    ) : (
                      <img
                        src="/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg"
                        alt="Default gig image"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {imagePreview ? 'Selected image preview' : 'Default gig image will be used'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Package */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Basic Package *</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Title
                </label>
                <input
                  type="text"
                  name="basic_title"
                  required
                  value={formData.basic_title}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Basic AI Solution"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="basic_price"
                  required
                  min="1"
                  step="0.01"
                  value={formData.basic_price}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Description
              </label>
              <textarea
                name="basic_description"
                required
                rows={3}
                value={formData.basic_description}
                onChange={handleInputChange}
                className="input-field"
                placeholder="What's included in the basic package..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Time (days)
              </label>
              <input
                type="number"
                name="basic_delivery_time"
                required
                min="1"
                value={formData.basic_delivery_time}
                onChange={handleInputChange}
                className="input-field"
                placeholder="7"
              />
            </div>
          </div>

          {/* Standard Package */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Standard Package (Optional)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Title
                </label>
                <input
                  type="text"
                  name="standard_title"
                  value={formData.standard_title}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Standard AI Solution"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="standard_price"
                  min="1"
                  step="0.01"
                  value={formData.standard_price}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="10"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Description
              </label>
              <textarea
                name="standard_description"
                rows={3}
                value={formData.standard_description}
                onChange={handleInputChange}
                className="input-field"
                placeholder="What's included in the standard package..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Time (days)
              </label>
              <input
                type="number"
                name="standard_delivery_time"
                min="1"
                value={formData.standard_delivery_time}
                onChange={handleInputChange}
                className="input-field"
                placeholder="5"
              />
            </div>
          </div>

          {/* Premium Package */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Premium Package (Optional)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Title
                </label>
                <input
                  type="text"
                  name="premium_title"
                  value={formData.premium_title}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Premium AI Solution"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="premium_price"
                  min="1"
                  step="0.01"
                  value={formData.premium_price}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="15"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Description
              </label>
              <textarea
                name="premium_description"
                rows={3}
                value={formData.premium_description}
                onChange={handleInputChange}
                className="input-field"
                placeholder="What's included in the premium package..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Time (days)
              </label>
              <input
                type="number"
                name="premium_delivery_time"
                min="1"
                value={formData.premium_delivery_time}
                onChange={handleInputChange}
                className="input-field"
                placeholder="3"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Gig'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}