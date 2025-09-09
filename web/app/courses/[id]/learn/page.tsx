'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  video_url?: string;
  duration_minutes: number;
  order: number;
  is_completed?: boolean;
}

interface Course {
  id: number;
  title: string;
  instructor: {
    first_name: string;
    last_name: string;
  };
}

export default function CourseLearningPage() {
  const router = useRouter();
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadCourse();
  }, [params.id]);

  // Add debug logging when lessons change
  useEffect(() => {
    console.log('Lessons state updated:', lessons.map(l => ({
      id: l.id,
      title: l.title,
      video_url: l.video_url,
      video_url_raw: JSON.stringify(l.video_url),
      video_url_type: typeof l.video_url,
      video_url_is_null: l.video_url === null,
      video_url_is_undefined: l.video_url === undefined,
      video_url_is_string_null: l.video_url === 'null',
      video_url_is_string_undefined: l.video_url === 'undefined',
      video_url_empty: !l.video_url || l.video_url.trim() === '',
      is_completed: l.is_completed
    })));
  }, [lessons]);

  useEffect(() => {
    if (currentLesson) {
      console.log('Current lesson changed:', {
        id: currentLesson.id,
        title: currentLesson.title,
        video_url: currentLesson.video_url,
        video_url_raw: JSON.stringify(currentLesson.video_url),
        has_video: !!currentLesson.video_url,
        video_url_type: typeof currentLesson.video_url,
        video_url_length: currentLesson.video_url ? currentLesson.video_url.length : 0,
        is_valid_video: (() => {
          const videoUrl = currentLesson?.video_url;
          return videoUrl && 
            videoUrl !== null && 
            videoUrl !== undefined && 
            videoUrl !== 'null' && 
            videoUrl !== 'undefined' && 
            typeof videoUrl === 'string' && 
            videoUrl.trim() !== '';
        })()
      });
    }
  }, [currentLesson]);

  const loadCourse = async () => {
    try {
      console.log(`Loading course ${params.id}...`);
      const [courseRes, lessonsRes] = await Promise.all([
        api.get(`/courses/${params.id}/`),
        api.get(`/courses/${params.id}/lessons/`)
      ]);
      
      setCourse(courseRes.data);
      const lessonsData = lessonsRes.data.results || lessonsRes.data;
      setLessons(lessonsData);
      
      console.log('Loaded lessons with video URLs:', lessonsData.map((l: Lesson) => ({
        id: l.id,
        title: l.title,
        video_url: l.video_url,
        video_url_raw: JSON.stringify(l.video_url),
        video_url_type: typeof l.video_url,
        has_video: !!l.video_url,
        is_valid_video: (() => {
          const videoUrl = l?.video_url;
          return videoUrl && 
            videoUrl !== null && 
            videoUrl !== undefined && 
            videoUrl !== 'null' && 
            videoUrl !== 'undefined' && 
            typeof videoUrl === 'string' && 
            videoUrl.trim() !== '';
        })(),
        is_completed: l.is_completed
      })));
      
      if (lessonsData.length > 0) {
        console.log('Setting first lesson as current:', {
          id: lessonsData[0].id,
          title: lessonsData[0].title,
          video_url: lessonsData[0].video_url,
          video_url_raw: JSON.stringify(lessonsData[0].video_url),
          video_url_type: typeof lessonsData[0].video_url
        });
        setCurrentLesson(lessonsData[0]);
      }
      
      const completedLessons = lessonsData.filter((l: Lesson) => l.is_completed).length;
      const calculatedProgress = (completedLessons / lessonsData.length) * 100;
      setProgress(calculatedProgress);
      
      console.log(`Course progress: ${completedLessons}/${lessonsData.length} = ${calculatedProgress}%`);
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async (lessonId: number) => {
    try {
      console.log(`Marking lesson ${lessonId} as complete...`);
      const response = await api.post(`/lessons/${lessonId}/complete/`);
      console.log('Lesson completion response:', response.data);
      
      // Update lessons state with completion status
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId ? { ...lesson, is_completed: true } : lesson
      ));
      
      // Update progress from server response
      if (response.data.progress !== undefined) {
        setProgress(response.data.progress);
        console.log(`Progress updated to: ${response.data.progress}%`);
      }
      
      toast.success(`Lesson completed! Progress: ${Math.round(response.data.progress || 0)}%`);
      
      // If course is completed, show special message
      if (response.data.course_completed) {
        toast.success('🎉 Congratulations! You completed the course!');
      }
      
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error('Failed to mark lesson complete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64 px-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-primary"></div>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 animate-pulse text-center">Loading course content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navigation />
      
      <div className="flex flex-col lg:flex-row min-h-screen pt-0">
        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-white dark:bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 overflow-y-auto custom-scrollbar no-horizontal-scroll shadow-lg max-h-80 lg:max-h-none">
          {/* Course Header */}
          <div className="p-3 lg:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10">
            <div className="flex items-start space-x-2 lg:space-x-3 mb-3 lg:mb-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-base lg:text-lg text-gray-900 dark:text-white leading-tight">{course?.title}</h2>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  by {course?.instructor.first_name} {course?.instructor.last_name}
                </p>
              </div>
            </div>
            
            {/* Progress Section */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-3 lg:p-4 shadow-sm">
              <div className="flex justify-between items-center text-xs lg:text-sm mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Course Progress</span>
                <span className="font-bold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 lg:h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary to-purple-500 h-2 lg:h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {lessons.filter(l => l.is_completed).length} of {lessons.length} lessons completed
              </p>
            </div>
          </div>
          
          {/* Lessons List */}
          <div className="p-3 lg:p-4">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="font-semibold text-sm lg:text-base text-gray-900 dark:text-white">Course Content</h3>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                {lessons.length} lessons
              </span>
            </div>
            <div className="space-y-1 lg:space-y-2 max-h-40 lg:max-h-96 overflow-y-auto custom-scrollbar no-horizontal-scroll">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  onClick={() => setCurrentLesson(lesson)}
                  className={`group p-2 lg:p-4 rounded-lg lg:rounded-xl cursor-pointer transition-all duration-200 border ${
                    currentLesson?.id === lesson.id
                      ? 'bg-gradient-to-r from-primary to-purple-500 text-white border-primary shadow-lg transform scale-[1.02]'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center text-xs lg:text-sm font-bold ${
                        currentLesson?.id === lesson.id
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 group-hover:bg-primary/10 group-hover:text-primary'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium text-xs lg:text-sm leading-tight ${
                          currentLesson?.id === lesson.id
                            ? 'text-white'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {lesson.title}
                        </h4>
                        <div className="flex items-center space-x-1 lg:space-x-2 mt-1">
                          <svg className={`w-3 h-3 ${
                            currentLesson?.id === lesson.id
                              ? 'text-white/70'
                              : 'text-gray-400 dark:text-gray-500'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className={`text-xs ${
                            currentLesson?.id === lesson.id
                              ? 'text-white/70'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {lesson.duration_minutes} min
                          </p>
                        </div>
                      </div>
                    </div>
                    {lesson.is_completed && (
                      <div className="w-5 h-5 lg:w-6 lg:h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {currentLesson ? (
            <>
              {/* Video Section */}
              <div className="flex-1 min-h-[200px] lg:min-h-[400px] bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 flex items-center justify-center relative">
                {(() => {
                  const videoUrl = currentLesson?.video_url;
                  const hasValidVideo = videoUrl && 
                    videoUrl !== null && 
                    videoUrl !== undefined && 
                    videoUrl !== 'null' && 
                    videoUrl !== 'undefined' && 
                    typeof videoUrl === 'string' && 
                    videoUrl.trim() !== '';
                  
                  if (hasValidVideo) {
                    const cleanUrl = videoUrl.trim();
                    const isYouTube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
                    
                    if (isYouTube) {
                      // Convert YouTube URL to embed format
                      let embedUrl = cleanUrl;
                      if (cleanUrl.includes('watch?v=')) {
                        const videoId = cleanUrl.split('watch?v=')[1].split('&')[0];
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                      } else if (cleanUrl.includes('youtu.be/')) {
                        const videoId = cleanUrl.split('youtu.be/')[1].split('?')[0];
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                      }
                      
                      return (
                        <div className="w-full h-full max-w-6xl mx-auto p-2 lg:p-4">
                          <iframe
                            className="w-full h-full min-h-[200px] lg:min-h-[400px] rounded-lg lg:rounded-xl shadow-2xl"
                            src={embedUrl}
                            title={currentLesson.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div className="w-full h-full max-w-6xl mx-auto p-2 lg:p-4">
                          <video
                            controls
                            className="w-full h-full min-h-[200px] lg:min-h-[400px] rounded-lg lg:rounded-xl shadow-2xl"
                            src={cleanUrl}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      );
                    }
                  }
                  
                  return (
                    <div className="text-center text-white px-4">
                      <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
                        <svg className="w-8 h-8 lg:w-12 lg:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg lg:text-xl font-semibold mb-2">Video Coming Soon</h3>
                      <p className="text-white/70 text-sm lg:text-base">Video content will be available here</p>
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 text-xs text-white/50">
                          <p>Debug: video_url = {JSON.stringify(videoUrl)}</p>
                          <p>Type: {typeof videoUrl}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {/* Lesson Progress Indicator */}
                <div className="absolute top-2 right-2 lg:top-4 lg:right-4">
                  {currentLesson.is_completed ? (
                    <div className="bg-green-500 text-white px-2 py-1 lg:px-3 lg:py-1 rounded-full text-xs lg:text-sm font-medium flex items-center space-x-1">
                      <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden lg:inline">Completed</span>
                    </div>
                  ) : (
                    <div className="bg-yellow-500 text-white px-2 py-1 lg:px-3 lg:py-1 rounded-full text-xs lg:text-sm font-medium">
                      <span className="hidden lg:inline">In Progress</span>
                      <span className="lg:hidden">•••</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="max-w-6xl mx-auto p-3 lg:p-6">
                  {/* Lesson Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 space-y-3 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 lg:space-x-3 mb-2">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs lg:text-sm font-medium">
                          Lesson {lessons.findIndex(l => l.id === currentLesson.id) + 1}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                          {currentLesson.duration_minutes} minutes
                        </span>
                      </div>
                      <h1 className="text-lg lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">{currentLesson.title}</h1>
                      <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-lg">{currentLesson.description}</p>
                    </div>
                    
                    {!currentLesson.is_completed && (
                      <button
                        onClick={() => markLessonComplete(currentLesson.id)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-1 lg:space-x-2 text-xs lg:text-base w-full lg:w-auto justify-center"
                      >
                        <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Mark Complete</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Lesson Content */}
                  {currentLesson.content && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg lg:rounded-xl p-4 lg:p-6 mb-6 lg:mb-8">
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4">Lesson Notes</h3>
                      <div className="prose prose-sm lg:prose prose-gray dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                      </div>
                    </div>
                  )}
                  
                  {/* Debug Info - Remove in production */}
                  {process.env.NODE_ENV === 'development' && currentLesson && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-8">
                      <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Info</h3>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                        <p><strong>Lesson ID:</strong> {currentLesson.id}</p>
                        <p><strong>Video URL Raw:</strong> {JSON.stringify(currentLesson.video_url)}</p>
                        <p><strong>Video URL String:</strong> {String(currentLesson.video_url || 'None')}</p>
                        <p><strong>Video URL Type:</strong> {typeof currentLesson.video_url}</p>
                        <p><strong>Video URL Length:</strong> {currentLesson.video_url ? String(currentLesson.video_url).length : 0}</p>
                        <p><strong>Is Null:</strong> {currentLesson.video_url === null ? 'Yes' : 'No'}</p>
                        <p><strong>Is Undefined:</strong> {currentLesson.video_url === undefined ? 'Yes' : 'No'}</p>
                        <p><strong>Is String 'null':</strong> {currentLesson.video_url === 'null' ? 'Yes' : 'No'}</p>
                        <p><strong>Is String 'undefined':</strong> {currentLesson.video_url === 'undefined' ? 'Yes' : 'No'}</p>
                        <p><strong>Is Valid Video:</strong> {(() => {
                          const videoUrl = currentLesson?.video_url;
                          return videoUrl && 
                            videoUrl !== null && 
                            videoUrl !== undefined && 
                            videoUrl !== 'null' && 
                            videoUrl !== 'undefined' && 
                            typeof videoUrl === 'string' && 
                            videoUrl.trim() !== '' ? 'Yes' : 'No';
                        })()}</p>
                      </div>
                    </div>
                  )}
                  {/* Take Skill Assessment Button */}
                  {progress >= 100 && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg lg:rounded-xl p-4 lg:p-6 mb-4 lg:mb-6 border border-blue-200 dark:border-blue-700">
                      <div className="flex flex-col items-center justify-between space-y-3 lg:space-y-4">
                        <div className="text-center">
                          <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-2">🎉 Course Completed!</h3>
                          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Test your knowledge with our skill assessment</p>
                        </div>
                        <Link
                          href="/skill-assessments"
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-500 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 text-sm lg:text-base w-full lg:w-auto justify-center"
                        >
                          <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Take Skill Assessment</span>
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  {/* Navigation */}
                  <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row justify-between items-center pt-4 lg:pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
                        if (currentIndex > 0) {
                          setCurrentLesson(lessons[currentIndex - 1]);
                        }
                      }}
                      disabled={lessons.findIndex(l => l.id === currentLesson.id) === 0}
                      className="flex items-center justify-center space-x-2 px-4 lg:px-6 py-2 lg:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg lg:rounded-xl font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base w-full lg:w-auto"
                    >
                      <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous Lesson</span>
                    </button>
                    
                    <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500 dark:text-gray-400 order-first lg:order-none">
                      <span>{lessons.findIndex(l => l.id === currentLesson.id) + 1}</span>
                      <span>of</span>
                      <span>{lessons.length}</span>
                      <span>lessons</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
                        if (currentIndex < lessons.length - 1) {
                          setCurrentLesson(lessons[currentIndex + 1]);
                        }
                      }}
                      disabled={lessons.findIndex(l => l.id === currentLesson.id) === lessons.length - 1}
                      className="flex items-center justify-center space-x-2 px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-primary to-purple-500 text-white rounded-lg lg:rounded-xl font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm lg:text-base w-full lg:w-auto"
                    >
                      <span>Next Lesson</span>
                      <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
                  <svg className="w-8 h-8 lg:w-12 lg:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3">Ready to Learn?</h2>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-4 lg:mb-6">Select a lesson from the sidebar to begin your learning journey</p>
                <div className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                    💡 Tip: Track your progress as you complete each lesson
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}