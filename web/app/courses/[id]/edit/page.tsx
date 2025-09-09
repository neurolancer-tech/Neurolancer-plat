'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
}

interface Lesson {
  id?: number;
  title: string;
  description: string;
  content: string;
  video_url?: string;
  duration_minutes: number;
  order: number;
  lesson_type: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  category: { id: number; name: string };
  price: string;
  difficulty_level: string;
  duration_hours: number;
  learning_outcomes: string;
  prerequisites: string;
  thumbnail?: string;
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [deletedLessons, setDeletedLessons] = useState<number[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadCourse();
    loadCategories();
  }, [params.id]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/');
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCourse = async () => {
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        api.get(`/courses/${params.id}/`),
        api.get(`/courses/${params.id}/lessons/`)
      ]);
      
      const course = courseRes.data;
      setFormData({
        title: course.title,
        description: course.description,
        category: course.category.id.toString(),
        price: course.price || '',
        difficulty_level: course.difficulty_level,
        duration_hours: course.duration_hours?.toString() || '',
        learning_outcomes: course.learning_outcomes || '',
        prerequisites: course.prerequisites || ''
      });

      if (course.thumbnail) {
        setImagePreview(course.thumbnail);
        setImageOption('none'); // Keep existing image
      }
      
      const lessonsData = lessonsRes.data.results || lessonsRes.data;
      setLessons(lessonsData.map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        video_url: lesson.video_url || lesson.content,
        duration_minutes: lesson.duration_minutes,
        order: lesson.order,
        lesson_type: lesson.lesson_type || 'video'
      })));
      
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
      router.push('/my-courses');
    } finally {
      setLoading(false);
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
    if (option === 'none') {
      // Keep existing image preview
    } else {
      setImagePreview('');
    }
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
      content: '',
      video_url: '',
      duration_minutes: 0,
      order: prev.length + 1,
      lesson_type: 'video'
    }]);
  };

  const updateLesson = (index: number, field: keyof Lesson, value: string | number) => {
    setLessons(prev => prev.map((lesson, i) => 
      i === index ? { ...lesson, [field]: value } : lesson
    ));
  };

  const removeLesson = (index: number) => {
    const lesson = lessons[index];
    if (lesson.id) {
      setDeletedLessons(prev => [...prev, lesson.id!]);
    }
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

    setSaving(true);
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
      
      // Add image based on option
      if (imageOption === 'upload' && imageFile) {
        formDataToSend.append('thumbnail', imageFile);
      } else if (imageOption === 'url' && imageUrl) {
        formDataToSend.append('thumbnail_url', imageUrl);
      }

      // Update course
      await api.put(`/courses/${params.id}/`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Delete removed lessons
      for (const lessonId of deletedLessons) {
        await api.delete(`/lessons/${lessonId}/`);
      }

      // Update/create lessons
      for (const lesson of lessons) {
        if (lesson.title) {
          const lessonData = {
            course: params.id,
            title: lesson.title,
            description: lesson.description,
            content: lesson.video_url || lesson.content,
            lesson_type: 'video',
            duration_minutes: lesson.duration_minutes,
            order: lesson.order
          };

          if (lesson.id) {
            // Update existing lesson
            await api.put(`/lessons/${lesson.id}/`, lessonData);
          } else {
            // Create new lesson
            await api.post('/lessons/create/', lessonData);
          }
        }
      }

      toast.success('Course updated successfully!');
      router.push('/my-courses');
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast.error(error.response?.data?.error || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

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
                    {step === 3 && 'Review & Update'}
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
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit Course Information</h2>
                
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
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="input-field"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      name="difficulty_level"
                      value={formData.difficulty_level}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      name="duration_hours"
                      value={formData.duration_hours}
                      onChange={handleInputChange}
                      min="1"
                      className="input-field"
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
                        Keep Current Image
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
                        Upload New Image
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
                          className="input-field"
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
                          className="input-field"
                        />
                      </div>
                    )}
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="flex items-center space-x-4">
                        <div className="w-32 h-20 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                          <img
                            src={imagePreview}
                            alt="Course thumbnail preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Course thumbnail preview
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Learning Outcomes
                    </label>
                    <textarea
                      name="learning_outcomes"
                      value={formData.learning_outcomes}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="What will students learn? (one per line)"
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prerequisites
                    </label>
                    <textarea
                      name="prerequisites"
                      value={formData.prerequisites}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="What should students know beforehand?"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Course Content */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Course Lessons</h2>
                  <button
                    type="button"
                    onClick={addLesson}
                    className="btn-primary"
                  >
                    + Add Lesson
                  </button>
                </div>
                
                {lessons.map((lesson, index) => (
                  <div key={lesson.id || index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Lesson {index + 1} {lesson.id && <span className="text-sm text-gray-500">(ID: {lesson.id})</span>}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeLesson(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Lesson Title *
                        </label>
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => updateLesson(index, 'title', e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={lesson.duration_minutes}
                          onChange={(e) => updateLesson(index, 'duration_minutes', parseInt(e.target.value) || 0)}
                          min="1"
                          className="input-field"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Video URL *
                      </label>
                      <input
                        type="url"
                        value={lesson.video_url || lesson.content}
                        onChange={(e) => {
                          updateLesson(index, 'video_url', e.target.value);
                          updateLesson(index, 'content', e.target.value);
                        }}
                        placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lesson Description
                      </label>
                      <textarea
                        value={lesson.description}
                        onChange={(e) => updateLesson(index, 'description', e.target.value)}
                        rows={2}
                        className="input-field"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Review Course Changes</h2>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">{formData.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{formData.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">${formData.price || '0'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Duration</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{formData.duration_hours || '1'} hours</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Difficulty</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{formData.difficulty_level}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Lessons</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{lessons.length}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Lessons:</h4>
                    <ul className="space-y-1">
                      {lessons.map((lesson, index) => (
                        <li key={lesson.id || index} className="text-sm text-gray-600 dark:text-gray-400">
                          {index + 1}. {lesson.title} ({lesson.duration_minutes}min)
                          {lesson.id && <span className="text-xs text-gray-400"> - Existing</span>}
                          {!lesson.id && <span className="text-xs text-green-600"> - New</span>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {deletedLessons.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2 text-red-600">Lessons to be deleted:</h4>
                      <p className="text-sm text-red-500">{deletedLessons.length} lesson(s) will be permanently deleted</p>
                    </div>
                  )}
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
                    disabled={saving}
                    className="btn-primary disabled:opacity-50"
                  >
                    {saving ? 'Updating...' : 'Update Course'}
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