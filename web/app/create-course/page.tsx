'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
}

interface Lesson {
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order: number;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    difficulty_level: 'beginner',
    duration_hours: '',
    learning_outcomes: '',
    prerequisites: ''
  });
  
  const [imageOption, setImageOption] = useState<'none' | 'upload' | 'url'>('none');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  
  const [lessons, setLessons] = useState<Lesson[]>([{
    title: '',
    description: '',
    video_url: '',
    duration_minutes: 0,
    order: 1
  }]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/');
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageOptionChange = (option: 'none' | 'upload' | 'url') => {
    setImageOption(option);
    setImageFile(null);
    setImageUrl('');
    setImagePreview('');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setImagePreview(url);
  };

  const addLesson = () => {
    setLessons(prev => [...prev, {
      title: '',
      description: '',
      video_url: '',
      duration_minutes: 0,
      order: prev.length + 1
    }]);
  };

  const updateLesson = (index: number, field: keyof Lesson, value: string | number) => {
    setLessons(prev => prev.map((lesson, i) => 
      i === index ? { ...lesson, [field]: value } : lesson
    ));
  };

  const removeLesson = (index: number) => {
    setLessons(prev => prev.filter((_, i) => i !== index).map((lesson, i) => ({
      ...lesson,
      order: i + 1
    })));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.title || !formData.description || !formData.category) {
        toast.error('Please fill in all required fields');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (lessons.some(lesson => !lesson.title || !lesson.video_url)) {
      toast.error('Please complete all lesson details');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Add course data
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category_id', formData.category);
      formDataToSend.append('price', formData.price || '0');
      formDataToSend.append('difficulty_level', formData.difficulty_level);
      formDataToSend.append('duration_hours', formData.duration_hours || '1');
      formDataToSend.append('learning_outcomes', formData.learning_outcomes);
      formDataToSend.append('prerequisites', formData.prerequisites);
      formDataToSend.append('status', 'published');
      
      // Add image based on option
      if (imageOption === 'upload' && imageFile) {
        formDataToSend.append('thumbnail', imageFile);
      } else if (imageOption === 'url' && imageUrl) {
        formDataToSend.append('thumbnail_url', imageUrl);
      }

      console.log('Sending course data with image option:', imageOption);
      const courseResponse = await api.post('/courses/', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Course created:', courseResponse.data);
      const courseId = courseResponse.data.id;

      // Create lessons
      for (const lesson of lessons) {
        if (lesson.title && lesson.video_url) {
          await api.post('/lessons/create/', {
            course: courseId,
            title: lesson.title,
            description: lesson.description,
            content: lesson.video_url,
            lesson_type: 'video',
            duration_minutes: lesson.duration_minutes,
            order: lesson.order
          });
        }
      }

      toast.success('Course created successfully!');
      router.push('/my-courses');
    } catch (error: any) {
      console.error('Error creating course:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      toast.error(error.response?.data?.error || error.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card rounded-lg shadow-sm p-6">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <div className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {step === 1 && 'Course Details'}
                    {step === 2 && 'Course Content'}
                    {step === 3 && 'Review & Publish'}
                  </div>
                  {step < 3 && <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Course Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Course Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      name="difficulty_level"
                      value={formData.difficulty_level}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      name="duration_hours"
                      value={formData.duration_hours}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Course Image Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Course Thumbnail
                  </label>
                  
                  <div className="space-y-4">
                    {/* Image Options */}
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="imageOption"
                          value="none"
                          checked={imageOption === 'none'}
                          onChange={() => handleImageOptionChange('none')}
                          className="mr-2"
                        />
                        No Image (Use Default)
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
                        Upload Image
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
                    
                    {/* Upload Input */}
                    {imageOption === 'upload' && (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    )}
                    
                    {/* URL Input */}
                    {imageOption === 'url' && (
                      <div>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={handleImageUrlChange}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    )}
                    
                    {/* Image Preview */}
                    <div className="flex items-center space-x-4">
                      <div className="w-32 h-20 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={imagePreview || '/assets/images/learn ai default.png'}
                          alt="Course thumbnail preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/images/learn ai default.png';
                          }}
                        />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {imageOption === 'none' && 'Default image will be used'}
                        {imageOption === 'upload' && !imageFile && 'Select an image file'}
                        {imageOption === 'url' && !imageUrl && 'Enter an image URL'}
                        {(imagePreview && imageOption !== 'none') && 'Preview of your course thumbnail'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Learning Outcomes
                    </label>
                    <textarea
                      name="learning_outcomes"
                      value={formData.learning_outcomes}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="What will students learn? (one per line)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prerequisites
                    </label>
                    <textarea
                      name="prerequisites"
                      value={formData.prerequisites}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="What should students know beforehand?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Course Content */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Course Lessons</h2>
                  <button
                    type="button"
                    onClick={addLesson}
                    className="btn-primary"
                  >
                    + Add Lesson
                  </button>
                </div>
                
                {lessons.map((lesson, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Lesson {index + 1}</h3>
                      {lessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLesson(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lesson Title *
                        </label>
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => updateLesson(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={lesson.duration_minutes}
                          onChange={(e) => updateLesson(index, 'duration_minutes', parseInt(e.target.value) || 0)}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video URL *
                      </label>
                      <input
                        type="url"
                        value={lesson.video_url}
                        onChange={(e) => updateLesson(index, 'video_url', e.target.value)}
                        placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lesson Description
                      </label>
                      <textarea
                        value={lesson.description}
                        onChange={(e) => updateLesson(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Review Your Course</h2>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">{formData.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{formData.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">${formData.price || '0'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Duration</span>
                      <p className="font-medium">{formData.duration_hours || '1'} hours</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Difficulty</span>
                      <p className="font-medium capitalize">{formData.difficulty_level}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Lessons</span>
                      <p className="font-medium">{lessons.length}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Lessons:</h4>
                    <ul className="space-y-1">
                      {lessons.map((lesson, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          {index + 1}. {lesson.title} ({lesson.duration_minutes}min)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn-primary"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Course'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}