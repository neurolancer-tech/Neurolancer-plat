'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Avatar from '@/components/Avatar';
import { Course, Category } from '@/types';
import { getProfile, isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Pagination from '@/components/Pagination';
interface Subcategory {
  id: number;
  category: number;
  name: string;
  description: string;
  created_at: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subcategory: '',
    difficulty: '',
    price: '',
    sortBy: 'created_at'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;

  useEffect(() => {
    const profile = getProfile();
    if (profile && profile.user_type !== 'freelancer' && profile.user_type !== 'both') {
      toast.error('Access denied. Learning resources are for freelancers only.');
      router.push('/gigs');
      return;
    }

    loadCategories();
    loadCourses();
  }, [router]);

  useEffect(() => {
    if (filters.category) {
      loadSubcategories(filters.category);
    } else {
      setSubcategories([]);
    }
  }, [filters.category]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/');
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses/');
      setCourses(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    setSubcategoriesLoading(true);
    try {
      const response = await api.get(`/subcategories/?category=${categoryId}`);
      setSubcategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ 
      ...filters, 
      [key]: value,
      // Clear subcategory when category changes
      ...(key === 'category' && { subcategory: '' })
    });
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                         course.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = !filters.category || course.category.id.toString() === filters.category;
    const matchesSubcategory = !filters.subcategory || 
      (((course as any).subcategories) && ((course as any).subcategories).some((sub: any) => sub.id.toString() === filters.subcategory));
    const matchesDifficulty = !filters.difficulty || course.difficulty_level === filters.difficulty;
    const matchesPrice = !filters.price || 
                        (filters.price === 'free' && course.price === 0) ||
                        (filters.price === 'paid' && course.price > 0);
    
    return matchesSearch && matchesCategory && matchesSubcategory && matchesDifficulty && matchesPrice;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'enrollment_count':
        return b.enrollment_count - a.enrollment_count;
      case 'price':
        return a.price - b.price;
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + coursesPerPage);

  const generateStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
      stars += '★';
    }
    if (hasHalfStar) {
      stars += '☆';
    }
    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
      stars += '☆';
    }
    
    return stars;
  };

  const showCourseDetail = (course: Course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const enrollInCourse = () => {
    if (!selectedCourse) return;
    
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    // Redirect to course checkout page
    setShowModal(false);
    router.push(`/course-checkout?courseId=${selectedCourse.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      
      {/* Hero Section */}
      <section 
        className="text-white py-16 relative"
        style={{
          background: 'linear-gradient(to right, #0D9E86, #0d7377)',
          backgroundImage: `url('/assets/images/learn ai default.png')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl font-bold mb-4">Master AI Skills</h1>
          <p className="text-xl mb-6">Learn from industry experts and advance your AI career with our comprehensive courses</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/skill-assessments')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center"
            >
              <i className="fas fa-medal mr-2"></i>
              Take Skill Assessment
            </button>
            <button
              onClick={() => {
                const coursesSection = document.querySelector('main');
                coursesSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-lg font-semibold transition-all border border-white/30 flex items-center justify-center"
            >
              <i className="fas fa-book mr-2"></i>
              Browse Courses
            </button>
          </div>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="card rounded-lg shadow-sm border p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Filter Courses</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search by title or topic..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory Filter */}
              {filters.category && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subcategory</label>
                  <select
                    value={filters.subcategory}
                    onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                    className="input-field"
                    disabled={subcategoriesLoading}
                  >
                    <option value="">All Subcategories</option>
                    {subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                  {subcategoriesLoading && (
                    <div className="text-xs text-gray-500 mt-1">Loading subcategories...</div>
                  )}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price</label>
                <select
                  value={filters.price}
                  onChange={(e) => handleFilterChange('price', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Prices</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <button
                onClick={() => setFilters({ search: '', category: '', subcategory: '', difficulty: '', price: '', sortBy: 'created_at' })}
                className="w-full text-primary py-2 px-4 rounded-lg border border-primary hover:bg-primary hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Courses List */}
          <div className="lg:w-3/4">
            <div className="card rounded-lg shadow-sm border">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Available Courses</h2>
                  <p className="text-gray-600 dark:text-gray-400">{filteredCourses.length} courses found</p>
                </div>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="input-field w-auto"
                >
                  <option value="created_at">Newest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="enrollment_count">Most Popular</option>
                  <option value="price">Price: Low to High</option>
                </select>
              </div>
              
              <div className="p-6">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No courses found</h3>
                    <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedCourses.map(course => (
                      <div
                        key={course.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:shadow-md transition-shadow card"
                        onClick={() => showCourseDetail(course)}
                      >
                        <Image
                          src={course.thumbnail || '/assets/images/learn ai default.png'}
                          alt={course.title}
                          width={300}
                          height={200}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {course.difficulty_level}
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              {course.price > 0 ? `$${course.price}` : 'Free'}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{course.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                          
                          {/* Subcategories */}
                          {((course as any).subcategories) && ((course as any).subcategories).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {((course as any).subcategories).slice(0, 2).map((sub: any) => (
                                <span key={sub.id} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                  {sub.name}
                                </span>
                              ))}
                              {((course as any).subcategories).length > 2 && (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                  +{((course as any).subcategories).length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {course.duration_hours}h
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              {course.enrollment_count} students
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-yellow-400 text-sm mr-2">
                                {generateStars(course.rating)}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 text-sm">({course.total_reviews})</span>
                            </div>
                            {course.is_enrolled ? (
                              <span className="text-green-600 text-sm font-medium">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Enrolled
                              </span>
                            ) : (
                              <span className="text-blue-600 text-sm font-medium">View Details</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Course Detail Modal */}
      {showModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedCourse.title}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Image
                    src={selectedCourse.thumbnail || '/assets/images/learn ai default.png'}
                    alt={selectedCourse.title}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <div className="text-gray-700 dark:text-gray-300 mb-6">{selectedCourse.description}</div>
                  
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">What You&apos;ll Learn</h3>
                  <div className="text-gray-700 dark:text-gray-300 mb-6">{selectedCourse.learning_outcomes}</div>
                  
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Prerequisites</h3>
                  <div className="text-gray-700 dark:text-gray-300">{selectedCourse.prerequisites || 'No prerequisites'}</div>
                </div>
                
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 sticky top-6">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {selectedCourse.price > 0 ? `$${selectedCourse.price}` : 'Free'}
                    </div>
                    <div className="flex items-center mb-4">
                      <span className="text-yellow-400 mr-2">{generateStars(selectedCourse.rating)}</span>
                      <span className="text-gray-600 dark:text-gray-400">({selectedCourse.total_reviews} reviews)</span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span>{selectedCourse.duration_hours} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Level:</span>
                        <span>{selectedCourse.difficulty_level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Students:</span>
                        <span>{selectedCourse.enrollment_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Instructor:</span>
                        <div className="flex items-center space-x-2">
                          <Avatar
                            src={selectedCourse.instructor.profile_picture}
                            avatarType={(selectedCourse.instructor as any).avatar_type || 'avatar'}
                            selectedAvatar={(selectedCourse.instructor as any).selected_avatar || 'user'}
                            googlePhotoUrl={(selectedCourse.instructor as any).google_photo_url}
                            size="sm"
                            alt={selectedCourse.instructor.first_name}
                          />
                          <span className="text-gray-900 dark:text-gray-100">{selectedCourse.instructor.first_name} {selectedCourse.instructor.last_name}</span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedCourse.is_enrolled ? (
                      <button
                        onClick={() => {
                          setShowModal(false);
                          router.push(`/courses/${selectedCourse.id}/learn`);
                        }}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                      >
                        Go to Course
                      </button>
                    ) : (
                      <button
                        onClick={enrollInCourse}
                        className="w-full btn-primary"
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}