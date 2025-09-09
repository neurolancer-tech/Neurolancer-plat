import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import AssessmentCategory, Assessment, Question, QuestionOption
from decimal import Decimal

# Create assessment categories
categories_data = [
    {
        'name': 'Machine Learning',
        'description': 'Test your knowledge of machine learning algorithms, concepts, and applications',
        'icon': 'fas fa-brain'
    },
    {
        'name': 'Python Programming',
        'description': 'Assess your Python programming skills and best practices',
        'icon': 'fab fa-python'
    },
    {
        'name': 'Data Science',
        'description': 'Evaluate your data analysis and visualization capabilities',
        'icon': 'fas fa-chart-bar'
    },
    {
        'name': 'Web Development',
        'description': 'Test your frontend and backend web development skills',
        'icon': 'fas fa-code'
    },
    {
        'name': 'AI Ethics',
        'description': 'Assess your understanding of ethical AI principles and practices',
        'icon': 'fas fa-balance-scale'
    }
]

print("Creating assessment categories...")
for cat_data in categories_data:
    category, created = AssessmentCategory.objects.get_or_create(
        name=cat_data['name'],
        defaults={
            'description': cat_data['description'],
            'icon': cat_data['icon']
        }
    )
    if created:
        print(f"Created category: {category.name}")

# Get admin user for created_by field
admin_user = User.objects.filter(is_superuser=True).first()
if not admin_user:
    admin_user = User.objects.first()

# Create assessments
assessments_data = [
    {
        'title': 'Machine Learning Fundamentals',
        'description': 'Test your understanding of basic machine learning concepts, algorithms, and applications.',
        'category': 'Machine Learning',
        'difficulty_level': 'beginner',
        'duration_minutes': 30,
        'passing_score': 70,
        'questions': [
            {
                'question_text': 'What is supervised learning?',
                'question_type': 'multiple_choice',
                'points': 2,
                'order': 1,
                'explanation': 'Supervised learning uses labeled training data to learn a mapping from inputs to outputs.',
                'options': [
                    {'text': 'Learning with labeled training data', 'correct': True},
                    {'text': 'Learning without any training data', 'correct': False},
                    {'text': 'Learning with unlabeled data only', 'correct': False},
                    {'text': 'Learning through trial and error', 'correct': False}
                ]
            },
            {
                'question_text': 'Which algorithm is commonly used for classification tasks?',
                'question_type': 'multiple_choice',
                'points': 2,
                'order': 2,
                'explanation': 'Random Forest is a popular ensemble method for classification tasks.',
                'options': [
                    {'text': 'Linear Regression', 'correct': False},
                    {'text': 'Random Forest', 'correct': True},
                    {'text': 'K-Means', 'correct': False},
                    {'text': 'PCA', 'correct': False}
                ]
            },
            {
                'question_text': 'Overfitting occurs when a model performs well on training data but poorly on test data.',
                'question_type': 'true_false',
                'points': 1,
                'order': 3,
                'explanation': 'This is the definition of overfitting - the model memorizes the training data.',
                'options': [
                    {'text': 'True', 'correct': True},
                    {'text': 'False', 'correct': False}
                ]
            }
        ]
    },
    {
        'title': 'Python Programming Essentials',
        'description': 'Evaluate your Python programming skills including syntax, data structures, and best practices.',
        'category': 'Python Programming',
        'difficulty_level': 'intermediate',
        'duration_minutes': 45,
        'passing_score': 75,
        'questions': [
            {
                'question_text': 'What is the output of: print(type([1, 2, 3]))?',
                'question_type': 'multiple_choice',
                'points': 2,
                'order': 1,
                'explanation': 'Lists in Python are of type "list".',
                'options': [
                    {'text': '<class "list">', 'correct': True},
                    {'text': '<class "array">', 'correct': False},
                    {'text': '<class "tuple">', 'correct': False},
                    {'text': '<class "dict">', 'correct': False}
                ]
            },
            {
                'question_text': 'Which method is used to add an element to the end of a list?',
                'question_type': 'multiple_choice',
                'points': 1,
                'order': 2,
                'explanation': 'The append() method adds an element to the end of a list.',
                'options': [
                    {'text': 'add()', 'correct': False},
                    {'text': 'append()', 'correct': True},
                    {'text': 'insert()', 'correct': False},
                    {'text': 'extend()', 'correct': False}
                ]
            },
            {
                'question_text': 'Python is a dynamically typed language.',
                'question_type': 'true_false',
                'points': 1,
                'order': 3,
                'explanation': 'Python determines variable types at runtime, making it dynamically typed.',
                'options': [
                    {'text': 'True', 'correct': True},
                    {'text': 'False', 'correct': False}
                ]
            }
        ]
    },
    {
        'title': 'Data Science Fundamentals',
        'description': 'Test your knowledge of data analysis, statistics, and visualization techniques.',
        'category': 'Data Science',
        'difficulty_level': 'beginner',
        'duration_minutes': 35,
        'passing_score': 70,
        'questions': [
            {
                'question_text': 'What does EDA stand for in data science?',
                'question_type': 'multiple_choice',
                'points': 2,
                'order': 1,
                'explanation': 'EDA stands for Exploratory Data Analysis.',
                'options': [
                    {'text': 'Exploratory Data Analysis', 'correct': True},
                    {'text': 'Extended Data Architecture', 'correct': False},
                    {'text': 'Experimental Data Approach', 'correct': False},
                    {'text': 'Enhanced Data Analytics', 'correct': False}
                ]
            },
            {
                'question_text': 'Which Python library is commonly used for data manipulation?',
                'question_type': 'multiple_choice',
                'points': 2,
                'order': 2,
                'explanation': 'Pandas is the most popular library for data manipulation in Python.',
                'options': [
                    {'text': 'NumPy', 'correct': False},
                    {'text': 'Pandas', 'correct': True},
                    {'text': 'Matplotlib', 'correct': False},
                    {'text': 'Seaborn', 'correct': False}
                ]
            }
        ]
    }
]

print("\nCreating assessments and questions...")
for assessment_data in assessments_data:
    category = AssessmentCategory.objects.get(name=assessment_data['category'])
    
    assessment, created = Assessment.objects.get_or_create(
        title=assessment_data['title'],
        defaults={
            'description': assessment_data['description'],
            'category': category,
            'difficulty_level': assessment_data['difficulty_level'],
            'duration_minutes': assessment_data['duration_minutes'],
            'passing_score': assessment_data['passing_score'],
            'price': Decimal('5.00'),
            'is_active': True,
            'created_by': admin_user
        }
    )
    
    if created:
        print(f"Created assessment: {assessment.title}")
        
        # Create questions for this assessment
        for question_data in assessment_data['questions']:
            question = Question.objects.create(
                assessment=assessment,
                question_text=question_data['question_text'],
                question_type=question_data['question_type'],
                points=question_data['points'],
                order=question_data['order'],
                explanation=question_data['explanation']
            )
            
            # Create options for this question
            for i, option_data in enumerate(question_data['options']):
                QuestionOption.objects.create(
                    question=question,
                    option_text=option_data['text'],
                    is_correct=option_data['correct'],
                    order=i + 1
                )
            
            print(f"  - Created question: {question.question_text[:50]}...")

print(f"\nAssessment system populated successfully!")
print(f"Created {AssessmentCategory.objects.count()} categories")
print(f"Created {Assessment.objects.count()} assessments")
print(f"Created {Question.objects.count()} questions")
print(f"Created {QuestionOption.objects.count()} question options")