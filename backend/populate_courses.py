import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Category, Course, Lesson, UserProfile
from decimal import Decimal

# Get or create instructor users
instructors_data = [
    {'username': 'dr_ai_smith', 'email': 'aismith@example.com', 'first_name': 'Dr. AI', 'last_name': 'Smith'},
    {'username': 'prof_ml_jones', 'email': 'mljones@example.com', 'first_name': 'Prof. ML', 'last_name': 'Jones'},
    {'username': 'expert_cv_brown', 'email': 'cvbrown@example.com', 'first_name': 'Expert CV', 'last_name': 'Brown'},
]

for instructor_data in instructors_data:
    user, created = User.objects.get_or_create(
        username=instructor_data['username'],
        defaults={
            'email': instructor_data['email'],
            'first_name': instructor_data['first_name'],
            'last_name': instructor_data['last_name'],
            'password': 'pbkdf2_sha256$600000$test$test'
        }
    )
    if created:
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'user_type': 'freelancer', 'bio': f'AI Expert and Course Instructor'}
        )
        print(f"Created instructor: {user.username}")

# Sample courses data
courses_data = [
    {
        'title': 'Introduction to Machine Learning',
        'description': 'Learn the fundamentals of machine learning including supervised and unsupervised learning, neural networks, and practical applications.',
        'category': 'AI Development & Engineering',
        'instructor': 'dr_ai_smith',
        'difficulty_level': 'beginner',
        'duration_hours': 20,
        'price': Decimal('99.99'),
        'prerequisites': 'Basic Python programming knowledge',
        'learning_outcomes': 'Understand ML concepts, implement basic algorithms, work with real datasets, build your first ML model',
        'enrollment_count': 1250,
        'rating': Decimal('4.7'),
        'total_reviews': 89
    },
    {
        'title': 'Advanced Deep Learning with PyTorch',
        'description': 'Master deep learning techniques using PyTorch. Cover CNNs, RNNs, GANs, and transformer architectures for real-world applications.',
        'category': 'AI Development & Engineering',
        'instructor': 'prof_ml_jones',
        'difficulty_level': 'advanced',
        'duration_hours': 35,
        'price': Decimal('199.99'),
        'prerequisites': 'Machine learning fundamentals, Python, linear algebra',
        'learning_outcomes': 'Build complex neural networks, implement state-of-the-art architectures, deploy models to production',
        'enrollment_count': 567,
        'rating': Decimal('4.9'),
        'total_reviews': 43
    },
    {
        'title': 'Computer Vision Fundamentals',
        'description': 'Comprehensive course on computer vision covering image processing, object detection, facial recognition, and OpenCV.',
        'category': 'AI Development & Engineering',
        'instructor': 'expert_cv_brown',
        'difficulty_level': 'intermediate',
        'duration_hours': 25,
        'price': Decimal('149.99'),
        'prerequisites': 'Python programming, basic mathematics',
        'learning_outcomes': 'Process images and videos, detect objects, implement facial recognition, build CV applications',
        'enrollment_count': 892,
        'rating': Decimal('4.6'),
        'total_reviews': 67
    },
    {
        'title': 'Natural Language Processing with Python',
        'description': 'Learn NLP techniques including text preprocessing, sentiment analysis, named entity recognition, and building chatbots.',
        'category': 'AI Development & Engineering',
        'instructor': 'dr_ai_smith',
        'difficulty_level': 'intermediate',
        'duration_hours': 30,
        'price': Decimal('179.99'),
        'prerequisites': 'Python programming, basic statistics',
        'learning_outcomes': 'Process text data, build sentiment analyzers, create chatbots, implement NLP pipelines',
        'enrollment_count': 734,
        'rating': Decimal('4.8'),
        'total_reviews': 52
    },
    {
        'title': 'AI Ethics and Responsible AI Development',
        'description': 'Understanding ethical implications of AI, bias detection, fairness metrics, and building responsible AI systems.',
        'category': 'AI Ethics, Law & Governance',
        'instructor': 'prof_ml_jones',
        'difficulty_level': 'intermediate',
        'duration_hours': 15,
        'price': Decimal('79.99'),
        'prerequisites': 'Basic understanding of AI/ML concepts',
        'learning_outcomes': 'Identify AI biases, implement fairness metrics, design ethical AI systems, understand legal implications',
        'enrollment_count': 445,
        'rating': Decimal('4.5'),
        'total_reviews': 31
    },
    {
        'title': 'Data Science for Beginners',
        'description': 'Complete introduction to data science covering data analysis, visualization, statistics, and machine learning basics.',
        'category': 'Data & Model Management',
        'instructor': 'expert_cv_brown',
        'difficulty_level': 'beginner',
        'duration_hours': 18,
        'price': Decimal('89.99'),
        'prerequisites': 'No prior experience required',
        'learning_outcomes': 'Analyze data, create visualizations, understand statistics, build predictive models',
        'enrollment_count': 1567,
        'rating': Decimal('4.4'),
        'total_reviews': 124
    },
    {
        'title': 'AI-Powered Automation and Workflow Integration',
        'description': 'Learn to integrate AI into business workflows, automate processes, and build intelligent systems for productivity.',
        'category': 'AI Integration & Support',
        'instructor': 'dr_ai_smith',
        'difficulty_level': 'intermediate',
        'duration_hours': 22,
        'price': Decimal('129.99'),
        'prerequisites': 'Basic programming knowledge, understanding of business processes',
        'learning_outcomes': 'Automate workflows, integrate AI APIs, build business intelligence systems, optimize processes',
        'enrollment_count': 623,
        'rating': Decimal('4.7'),
        'total_reviews': 45
    },
    {
        'title': 'Creative AI: Art, Music, and Design',
        'description': 'Explore AI applications in creative fields including generative art, music composition, and design automation.',
        'category': 'Creative & Industry-Specific AI',
        'instructor': 'expert_cv_brown',
        'difficulty_level': 'beginner',
        'duration_hours': 16,
        'price': Decimal('69.99'),
        'prerequisites': 'Interest in creative fields, basic computer skills',
        'learning_outcomes': 'Generate AI art, compose music with AI, automate design processes, understand creative AI tools',
        'enrollment_count': 789,
        'rating': Decimal('4.6'),
        'total_reviews': 58
    }
]

# Create courses
for course_data in courses_data:
    try:
        category = Category.objects.get(name=course_data['category'])
        instructor = User.objects.get(username=course_data['instructor'])
        
        course, created = Course.objects.get_or_create(
            title=course_data['title'],
            defaults={
                'description': course_data['description'],
                'category': category,
                'instructor': instructor,
                'difficulty_level': course_data['difficulty_level'],
                'duration_hours': course_data['duration_hours'],
                'price': course_data['price'],
                'prerequisites': course_data['prerequisites'],
                'learning_outcomes': course_data['learning_outcomes'],
                'status': 'published',
                'enrollment_count': course_data['enrollment_count'],
                'rating': course_data['rating'],
                'total_reviews': course_data['total_reviews']
            }
        )
        
        if created:
            print(f"Created course: {course.title}")
            
            # Add sample lessons for each course
            lessons_data = [
                {
                    'title': f'Introduction to {course.title}',
                    'description': f'Overview and introduction to the {course.title} course',
                    'lesson_type': 'video',
                    'duration_minutes': 30,
                    'order': 1,
                    'is_preview': True
                },
                {
                    'title': 'Core Concepts and Theory',
                    'description': 'Deep dive into the fundamental concepts and theoretical foundations',
                    'lesson_type': 'video',
                    'duration_minutes': 45,
                    'order': 2,
                    'is_preview': False
                },
                {
                    'title': 'Practical Implementation',
                    'description': 'Hands-on coding and implementation exercises',
                    'lesson_type': 'video',
                    'duration_minutes': 60,
                    'order': 3,
                    'is_preview': False
                },
                {
                    'title': 'Real-World Applications',
                    'description': 'Case studies and real-world application examples',
                    'lesson_type': 'video',
                    'duration_minutes': 40,
                    'order': 4,
                    'is_preview': False
                },
                {
                    'title': 'Final Project and Assessment',
                    'description': 'Complete a final project to demonstrate your learning',
                    'lesson_type': 'assignment',
                    'duration_minutes': 90,
                    'order': 5,
                    'is_preview': False
                }
            ]
            
            for lesson_data in lessons_data:
                lesson, lesson_created = Lesson.objects.get_or_create(
                    course=course,
                    title=lesson_data['title'],
                    defaults={
                        'description': lesson_data['description'],
                        'lesson_type': lesson_data['lesson_type'],
                        'duration_minutes': lesson_data['duration_minutes'],
                        'order': lesson_data['order'],
                        'is_preview': lesson_data['is_preview']
                    }
                )
                if lesson_created:
                    print(f"  - Added lesson: {lesson.title}")
    
    except Category.DoesNotExist:
        print(f"Category '{course_data['category']}' not found for course '{course_data['title']}'")
    except User.DoesNotExist:
        print(f"Instructor '{course_data['instructor']}' not found for course '{course_data['title']}'")

print("\nCourses populated successfully!")
print("You can now:")
print("1. View courses: http://localhost:8000/api/courses/")
print("2. Test the courses page: http://localhost:5174/courses.html")