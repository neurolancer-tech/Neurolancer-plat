#!/usr/bin/env python
"""
Sample data population script for Learning & Development system
Run this after creating migrations: python populate_learning_data.py
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import (
    Category, Course, Lesson, SkillAssessment, AssessmentQuestion, 
    SkillBadge, CourseReview, Enrollment
)

def create_sample_courses():
    """Create sample courses for the learning system"""
    
    # Get or create categories
    ml_category, _ = Category.objects.get_or_create(
        name="Machine Learning",
        defaults={"description": "Machine Learning and AI algorithms"}
    )
    
    cv_category, _ = Category.objects.get_or_create(
        name="Computer Vision",
        defaults={"description": "Image processing and computer vision"}
    )
    
    nlp_category, _ = Category.objects.get_or_create(
        name="Natural Language Processing",
        defaults={"description": "Text processing and language understanding"}
    )
    
    # Get or create instructor (admin user)
    instructor, _ = User.objects.get_or_create(
        username='ai_instructor',
        defaults={
            'first_name': 'Dr. Sarah',
            'last_name': 'Johnson',
            'email': 'sarah.johnson@neurolancer.com',
            'is_staff': True
        }
    )
    
    # Create sample courses
    courses_data = [
        {
            'title': 'Introduction to Machine Learning',
            'description': 'Learn the fundamentals of machine learning including supervised and unsupervised learning algorithms.',
            'category': ml_category,
            'instructor': instructor,
            'difficulty_level': 'beginner',
            'duration_hours': 20,
            'price': Decimal('99.99'),
            'prerequisites': 'Basic Python programming knowledge',
            'learning_outcomes': 'Understand ML concepts, implement basic algorithms, work with datasets, evaluate model performance',
            'status': 'published',
            'is_featured': True
        },
        {
            'title': 'Deep Learning with Neural Networks',
            'description': 'Master deep learning concepts and build neural networks from scratch using TensorFlow and PyTorch.',
            'category': ml_category,
            'instructor': instructor,
            'difficulty_level': 'advanced',
            'duration_hours': 40,
            'price': Decimal('199.99'),
            'prerequisites': 'Machine Learning basics, Python, Linear Algebra',
            'learning_outcomes': 'Build neural networks, understand backpropagation, implement CNNs and RNNs, work with deep learning frameworks',
            'status': 'published',
            'is_featured': True
        },
        {
            'title': 'Computer Vision Fundamentals',
            'description': 'Learn image processing, feature detection, and object recognition techniques.',
            'category': cv_category,
            'instructor': instructor,
            'difficulty_level': 'intermediate',
            'duration_hours': 30,
            'price': Decimal('149.99'),
            'prerequisites': 'Python programming, Basic mathematics',
            'learning_outcomes': 'Process images, detect features, implement object detection, work with OpenCV',
            'status': 'published'
        },
        {
            'title': 'Natural Language Processing Basics',
            'description': 'Understand text processing, sentiment analysis, and language models.',
            'category': nlp_category,
            'instructor': instructor,
            'difficulty_level': 'intermediate',
            'duration_hours': 25,
            'price': Decimal('129.99'),
            'prerequisites': 'Python programming, Basic statistics',
            'learning_outcomes': 'Process text data, perform sentiment analysis, build language models, work with NLTK and spaCy',
            'status': 'published'
        },
        {
            'title': 'AI Ethics and Responsible AI',
            'description': 'Learn about ethical considerations in AI development and deployment.',
            'category': ml_category,
            'instructor': instructor,
            'difficulty_level': 'beginner',
            'duration_hours': 10,
            'price': Decimal('0.00'),  # Free course
            'prerequisites': 'None',
            'learning_outcomes': 'Understand AI ethics, identify bias in AI systems, implement responsible AI practices',
            'status': 'published'
        }
    ]
    
    created_courses = []
    for course_data in courses_data:
        course, created = Course.objects.get_or_create(
            title=course_data['title'],
            defaults=course_data
        )
        if created:
            print(f"Created course: {course.title}")
        created_courses.append(course)
    
    return created_courses

def create_sample_lessons(courses):
    """Create sample lessons for courses"""
    
    lessons_data = {
        'Introduction to Machine Learning': [
            {
                'title': 'What is Machine Learning?',
                'description': 'Introduction to ML concepts and applications',
                'lesson_type': 'video',
                'content': 'Overview of machine learning, types of learning, and real-world applications',
                'duration_minutes': 45,
                'order': 1,
                'is_preview': True
            },
            {
                'title': 'Setting Up Your Environment',
                'description': 'Install Python, Jupyter, and ML libraries',
                'lesson_type': 'text',
                'content': 'Step-by-step guide to setting up your machine learning development environment',
                'duration_minutes': 30,
                'order': 2,
                'is_preview': True
            },
            {
                'title': 'Linear Regression',
                'description': 'Understanding and implementing linear regression',
                'lesson_type': 'video',
                'content': 'Mathematical foundations and practical implementation of linear regression',
                'duration_minutes': 60,
                'order': 3
            },
            {
                'title': 'Classification Algorithms',
                'description': 'Logistic regression and decision trees',
                'lesson_type': 'video',
                'content': 'Learn classification techniques and when to use them',
                'duration_minutes': 75,
                'order': 4
            },
            {
                'title': 'Model Evaluation',
                'description': 'Metrics and validation techniques',
                'lesson_type': 'text',
                'content': 'Understanding accuracy, precision, recall, and cross-validation',
                'duration_minutes': 45,
                'order': 5
            }
        ],
        'AI Ethics and Responsible AI': [
            {
                'title': 'Introduction to AI Ethics',
                'description': 'Why ethics matter in AI',
                'lesson_type': 'video',
                'content': 'Overview of ethical considerations in AI development',
                'duration_minutes': 30,
                'order': 1,
                'is_preview': True
            },
            {
                'title': 'Bias in AI Systems',
                'description': 'Identifying and mitigating bias',
                'lesson_type': 'text',
                'content': 'Types of bias and strategies to address them',
                'duration_minutes': 40,
                'order': 2,
                'is_preview': True
            },
            {
                'title': 'Fairness and Transparency',
                'description': 'Building fair and explainable AI',
                'lesson_type': 'video',
                'content': 'Principles of fair AI and explainability techniques',
                'duration_minutes': 35,
                'order': 3
            }
        ]
    }
    
    for course in courses:
        if course.title in lessons_data:
            for lesson_data in lessons_data[course.title]:
                lesson_data['course'] = course
                lesson, created = Lesson.objects.get_or_create(
                    course=course,
                    title=lesson_data['title'],
                    defaults=lesson_data
                )
                if created:
                    print(f"Created lesson: {lesson.title} for {course.title}")

def create_sample_assessments():
    """Create sample skill assessments"""
    
    # Get categories
    ml_category = Category.objects.get(name="Machine Learning")
    cv_category = Category.objects.get(name="Computer Vision")
    nlp_category = Category.objects.get(name="Natural Language Processing")
    
    assessments_data = [
        {
            'title': 'Python for Machine Learning Assessment',
            'description': 'Test your Python programming skills for machine learning applications',
            'skill_name': 'Python Programming',
            'category': ml_category,
            'difficulty_level': 'beginner',
            'time_limit_minutes': 45,
            'passing_score': 70,
            'status': 'published'
        },
        {
            'title': 'Machine Learning Fundamentals Quiz',
            'description': 'Assess your understanding of basic machine learning concepts',
            'skill_name': 'Machine Learning Basics',
            'category': ml_category,
            'difficulty_level': 'intermediate',
            'time_limit_minutes': 60,
            'passing_score': 75,
            'status': 'published'
        },
        {
            'title': 'Computer Vision Concepts Test',
            'description': 'Evaluate your knowledge of computer vision techniques',
            'skill_name': 'Computer Vision',
            'category': cv_category,
            'difficulty_level': 'intermediate',
            'time_limit_minutes': 50,
            'passing_score': 70,
            'status': 'published'
        },
        {
            'title': 'NLP Fundamentals Assessment',
            'description': 'Test your understanding of natural language processing',
            'skill_name': 'Natural Language Processing',
            'category': nlp_category,
            'difficulty_level': 'intermediate',
            'time_limit_minutes': 55,
            'passing_score': 75,
            'status': 'published'
        }
    ]
    
    created_assessments = []
    for assessment_data in assessments_data:
        assessment, created = SkillAssessment.objects.get_or_create(
            title=assessment_data['title'],
            defaults=assessment_data
        )
        if created:
            print(f"Created assessment: {assessment.title}")
        created_assessments.append(assessment)
    
    return created_assessments

def create_sample_questions(assessments):
    """Create sample questions for assessments"""
    
    questions_data = {
        'Python for Machine Learning Assessment': [
            {
                'question_text': 'Which library is commonly used for numerical computing in Python?',
                'question_type': 'multiple_choice',
                'options': ['NumPy', 'Requests', 'Flask', 'Django'],
                'correct_answer': 'NumPy',
                'explanation': 'NumPy is the fundamental library for numerical computing in Python',
                'points': 1,
                'order': 1
            },
            {
                'question_text': 'Pandas is primarily used for data manipulation and analysis.',
                'question_type': 'true_false',
                'correct_answer': 'true',
                'explanation': 'Pandas is indeed the primary library for data manipulation and analysis in Python',
                'points': 1,
                'order': 2
            },
            {
                'question_text': 'What does the fit() method do in scikit-learn?',
                'question_type': 'short_answer',
                'correct_answer': 'trains the model',
                'explanation': 'The fit() method trains/fits the machine learning model on the training data',
                'points': 2,
                'order': 3
            }
        ],
        'Machine Learning Fundamentals Quiz': [
            {
                'question_text': 'What type of learning uses labeled training data?',
                'question_type': 'multiple_choice',
                'options': ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Deep Learning'],
                'correct_answer': 'Supervised Learning',
                'explanation': 'Supervised learning uses labeled training data to learn patterns',
                'points': 1,
                'order': 1
            },
            {
                'question_text': 'Overfitting occurs when a model performs well on training data but poorly on test data.',
                'question_type': 'true_false',
                'correct_answer': 'true',
                'explanation': 'Overfitting is when a model memorizes training data but fails to generalize',
                'points': 1,
                'order': 2
            },
            {
                'question_text': 'Name two common metrics for evaluating classification models.',
                'question_type': 'short_answer',
                'correct_answer': 'accuracy precision recall',
                'explanation': 'Common classification metrics include accuracy, precision, recall, and F1-score',
                'points': 2,
                'order': 3
            }
        ]
    }
    
    for assessment in assessments:
        if assessment.title in questions_data:
            for question_data in questions_data[assessment.title]:
                question_data['assessment'] = assessment
                question, created = AssessmentQuestion.objects.get_or_create(
                    assessment=assessment,
                    question_text=question_data['question_text'],
                    defaults=question_data
                )
                if created:
                    print(f"Created question for {assessment.title}")

def create_sample_reviews(courses):
    """Create sample course reviews"""
    
    # Get some users for reviews (create if they don't exist)
    reviewers = []
    for i in range(3):
        user, created = User.objects.get_or_create(
            username=f'student_{i+1}',
            defaults={
                'first_name': f'Student',
                'last_name': f'{i+1}',
                'email': f'student{i+1}@example.com'
            }
        )
        reviewers.append(user)
    
    reviews_data = [
        {
            'course': courses[0],  # Introduction to Machine Learning
            'student': reviewers[0],
            'rating': 5,
            'comment': 'Excellent course! Very clear explanations and practical examples. Highly recommended for beginners.'
        },
        {
            'course': courses[0],
            'student': reviewers[1],
            'rating': 4,
            'comment': 'Good course content, but could use more hands-on exercises. Overall very informative.'
        },
        {
            'course': courses[4],  # AI Ethics
            'student': reviewers[2],
            'rating': 5,
            'comment': 'Important topic covered very well. Every AI practitioner should take this course.'
        }
    ]
    
    for review_data in reviews_data:
        review, created = CourseReview.objects.get_or_create(
            course=review_data['course'],
            student=review_data['student'],
            defaults=review_data
        )
        if created:
            print(f"Created review for {review_data['course'].title}")
            
            # Update course rating
            course = review_data['course']
            reviews = CourseReview.objects.filter(course=course)
            avg_rating = sum(r.rating for r in reviews) / len(reviews)
            course.rating = avg_rating
            course.total_reviews = len(reviews)
            course.save()

def main():
    """Main function to populate learning data"""
    print("🎓 Populating Learning & Development sample data...")
    
    try:
        # Create courses
        print("\n📚 Creating sample courses...")
        courses = create_sample_courses()
        
        # Create lessons
        print("\n📖 Creating sample lessons...")
        create_sample_lessons(courses)
        
        # Create assessments
        print("\n📝 Creating sample assessments...")
        assessments = create_sample_assessments()
        
        # Create questions
        print("\n❓ Creating sample questions...")
        create_sample_questions(assessments)
        
        # Create reviews
        print("\n⭐ Creating sample reviews...")
        create_sample_reviews(courses)
        
        print("\n✅ Learning & Development sample data created successfully!")
        print("\n📊 Summary:")
        print(f"   - Courses: {Course.objects.count()}")
        print(f"   - Lessons: {Lesson.objects.count()}")
        print(f"   - Assessments: {SkillAssessment.objects.count()}")
        print(f"   - Questions: {AssessmentQuestion.objects.count()}")
        print(f"   - Reviews: {CourseReview.objects.count()}")
        
        print("\n🎯 Next steps:")
        print("   1. Run migrations: python manage.py migrate")
        print("   2. Access admin panel to upload course files")
        print("   3. Test the learning system on the frontend")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()