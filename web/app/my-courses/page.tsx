'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: {
    first_name: string;
    last_name: string;
  };
  category: {
    name: string;
  };
  thumbnail: string;
  progress_percentage: number;
  status: string;
  enrollment_date: string;
  completed_at?: string;
  rating?: number;
  duration_hours: number;

}

export default function MyCoursesPage() {
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'enrolled' | 'created'>('enrolled');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadCourses();
  }, []);

  useEffect(() => {
    // Refresh courses when page becomes visible (user returns from learning page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCourses();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadCourses = async () => {
    try {
      console.log('Loading my courses...');
      const [enrolledResponse, createdResponse] = await Promise.all([
        api.get('/courses/my/'),
        api.get('/courses/my-created/')
      ]);
      
      const enrolledData = enrolledResponse.data.results || enrolledResponse.data;
      const createdData = createdResponse.data.results || createdResponse.data;
      
      console.log('Enrolled courses data:', enrolledData);
      console.log('Created courses data:', createdData);
      
      setEnrolledCourses(enrolledData);
      setCreatedCourses(createdData);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const currentCourses = activeTab === 'enrolled' ? enrolledCourses : createdCourses;
  const filteredCourses = currentCourses.filter(course => {
    if (activeTab === 'enrolled') {
      if (filter === 'active') return course.status === 'active';
      if (filter === 'completed') return course.status === 'completed';
    }
    return true;
  });

  const continueCourse = (courseId: number) => {
    router.push(`/courses/${courseId}/learn`);
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Courses</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/create-course')}
                className="btn-primary"
              >
                Create Course
              </button>
              <button
                onClick={() => {
                  setLoading(true);
                  loadCourses();
                }}
                className="btn-secondary"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'enrolled'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Enrolled Courses ({enrolledCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'created'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Created Courses ({createdCourses.length})
            </button>
          </div>

          {/* Filter for enrolled courses only */}
          {activeTab === 'enrolled' && (
            <div className="mb-6">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'completed')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Courses</option>
                <option value="active">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No courses found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {activeTab === 'enrolled' 
                    ? (filter === 'all' 
                        ? "You haven't enrolled in any courses yet" 
                        : `No ${filter} courses found`)
                    : "You haven't created any courses yet"
                  }
                </p>
                <button
                  onClick={() => router.push(activeTab === 'enrolled' ? '/courses' : '/create-course')}
                  className="btn-primary"
                >
                  {activeTab === 'enrolled' ? 'Browse Courses' : 'Create Course'}
                </button>
              </div>
            ) : (
              filteredCourses.map(course => (
                <div key={course.id} className="card border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <img
                    src={course.thumbnail || '/api/placeholder/300/200'}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {course.category.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        course.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {course.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">{course.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{course.description}</p>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      by {course.instructor.first_name} {course.instructor.last_name}
                    </div>
                    
                    {activeTab === 'enrolled' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{Math.round(course.progress_percentage || 0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, course.progress_percentage || 0))}%` }}
                          ></div>
                        </div>
                        {(course as any).debug_info && (
                          <div className="text-xs text-gray-500 mt-1">
                            {(course as any).debug_info.completed_lessons}/{(course as any).debug_info.total_lessons} lessons
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {course.duration_hours}h total
                      </div>
                      
                      <div className="flex space-x-2">
                        {activeTab === 'enrolled' ? (
                          course.status === 'completed' ? (
                            <>
                              <button
                                onClick={() => continueCourse(course.id)}
                                className="btn-secondary text-sm"
                              >
                                Revisit
                              </button>
                              <button
                                onClick={() => router.push(`/course-reviews?course=${course.id}`)}
                                className="btn-primary text-sm"
                              >
                                Leave Review
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => continueCourse(course.id)}
                              className="btn-primary text-sm"
                            >
                              Continue
                            </button>
                          )
                        ) : (
                          <>
                            <button
                              onClick={() => router.push(`/courses/${course.id}`)}
                              className="btn-secondary text-sm"
                            >
                              View Course
                            </button>
                            <button
                              onClick={() => router.push(`/courses/${course.id}/edit`)}
                              className="btn-primary text-sm"
                            >
                              Edit
                            </button>
                          </>
                        )}

                      </div>
                    </div>
                    
                    {course.completed_at && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                        Completed on {new Date(course.completed_at).toLocaleDateString()}
                      </div>
                    )}
                    

                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Learning Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">Learning Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Enrolled Courses</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{enrolledCourses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created Courses</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{createdCourses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">
                  {enrolledCourses.filter(c => c.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">In Progress</span>
                <span className="font-semibold text-blue-600">
                  {enrolledCourses.filter(c => c.status === 'active').length}
                </span>
              </div>
            </div>
          </div>
          
          <div className="card rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">Recent Activity</h3>
            <div className="space-y-3">
              {enrolledCourses
                .filter(c => c.status === 'active')
                .slice(0, 3)
                .map(course => (
                  <div key={course.id} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{course.title}</div>
                      <div className="text-xs text-gray-500">
                        {Math.round(course.progress_percentage || 0)}% complete
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="card rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/courses')}
                className="w-full btn-secondary text-left"
              >
                Browse New Courses
              </button>
              <button
                onClick={() => router.push('/skill-assessments')}
                className="w-full btn-secondary text-left"
              >
                Take Skill Assessment
              </button>
              <button
                onClick={() => router.push('/create-course')}
                className="w-full btn-primary text-left"
              >
                Create Your Course
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}