'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Category } from '@/types';
import { isAuthenticated, getProfile } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditGigPage() {
  const params = useParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
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
    premium_delivery_time: '',
    is_active: true
  });

  // Image selection state
  const [imageOption, setImageOption] = useState<'none' | 'upload' | 'url'>('none');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const profile = getProfile();
    if (profile && profile.user_type !== 'freelancer' && profile.user_type !== 'both') {
      toast.error('Only freelancers can edit gigs');
      router.push('/dashboard');
      return;
    }

    if (params.id) {
      loadGig(params.id as string);
      loadCategories();
    }
  }, [router, params.id]);

  const loadGig = async (id: string) => {
    try {
      const response = await api.get(`/gigs/${id}/`);
      const gig = response.data;
      
      setFormData({
        title: gig.title || '',
        description: gig.description || '',
        category: gig.category?.id?.toString() || '',
        tags: gig.tags || '',
        basic_title: gig.basic_title || '',
        basic_description: gig.basic_description || '',
        basic_price: gig.basic_price?.toString() || '',
        basic_delivery_time: gig.basic_delivery_time?.toString() || '',
        standard_title: gig.standard_title || '',
        standard_description: gig.standard_description || '',
        standard_price: gig.standard_price?.toString() || '',
        standard_delivery_time: gig.standard_delivery_time?.toString() || '',
        premium_title: gig.premium_title || '',
        premium_description: gig.premium_description || '',
        premium_price: gig.premium_price?.toString() || '',
        premium_delivery_time: gig.premium_delivery_time?.toString() || '',
        is_active: gig.is_active
      });
      
      // Set current image and determine image option
      setCurrentImage(gig.image || null);
      if (gig.image && gig.image !== '/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg') {
        if (gig.image.startsWith('http')) {
          setImageOption('url');
          setImageUrl(gig.image);
          setImagePreview(gig.image);
        } else {
          setImageOption('upload');
          setImagePreview(gig.image);
        }
      } else {
        setImageOption('none');
        setImagePreview('/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg');
      }
    } catch (error: any) {
      toast.error('Failed to load gig');
      router.push('/my-gigs');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/');
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleImageOptionChange = (option: 'none' | 'upload' | 'url') => {
    setImageOption(option);
    setImageFile(null);
    setImageUrl('');
    
    if (option === 'none') {
      setImagePreview('/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg');
    } else {
      setImagePreview(null);
    }
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
    if (url.trim()) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          // Convert category to category_id for backend compatibility
          if (key === 'category') {
            submitData.append('category_id', value.toString());
          } else {
            submitData.append(key, value.toString());
          }
        }
      });
      
      // Handle image updates properly
      if (imageOption === 'upload' && imageFile) {
        // Upload new image file
        submitData.append('image', imageFile);
        submitData.append('image_url', ''); // Clear URL field
        // Explicitly clear the old image field to force update
        submitData.append('clear_image', 'true');
      } else if (imageOption === 'url' && imageUrl) {
        // Use image URL
        submitData.append('image_url', imageUrl);
        // Clear the image field to avoid conflicts
        submitData.append('clear_image', 'true');
      } else if (imageOption === 'none') {
        // Use default image - clear both fields
        submitData.append('image_url', '');
        submitData.append('clear_image', 'true');
      }
      
      await api.put(`/gigs/${params.id}/update/`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Gig updated successfully!');
      router.push('/my-gigs');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update gig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Edit Gig</h1>
          <p className="text-gray-600 dark:text-gray-400">Update your AI service offering</p>
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

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>

            {/* Image Selection */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                    ) : currentImage && imageOption !== 'none' ? (
                      <img
                        src={currentImage}
                        alt="Current image"
                        className="w-full h-full object-cover"
                        onError={() => setCurrentImage('/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg')}
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
                    {imagePreview ? (
                      imageOption === 'none' ? 'Default image will be used' : 'New image preview'
                    ) : currentImage && imageOption !== 'none' ? (
                      'Current image'
                    ) : (
                      'Default gig image will be used'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active (visible to clients)</span>
              </label>
            </div>
          </div>

          {/* Basic Package */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Basic Package *</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Package Title
                </label>
                <input
                  type="text"
                  name="basic_title"
                  required
                  value={formData.basic_title}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package Description
              </label>
              <textarea
                name="basic_description"
                required
                rows={3}
                value={formData.basic_description}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              />
            </div>
          </div>

          {/* Standard Package */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Standard Package (Optional)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              {loading ? 'Updating...' : 'Update Gig'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}