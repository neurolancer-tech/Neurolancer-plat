import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, Job, Proposal, Category
from datetime import datetime, timedelta

# Create test user
username = 'freelancerkb'
user, created = User.objects.get_or_create(
    username=username,
    defaults={
        'email': 'freelancerkb@example.com',
        'first_name': 'Freelancer',
        'last_name': 'KB',
        'password': 'pbkdf2_sha256$600000$test$test'
    }
)

if created:
    print(f"Created user: {username}")
else:
    print(f"User {username} already exists")

# Create or get profile
profile, created = UserProfile.objects.get_or_create(
    user=user,
    defaults={
        'user_type': 'freelancer',
        'bio': 'Test freelancer for development'
    }
)

if created:
    print(f"Created profile for {username}")
else:
    print(f"Profile for {username} already exists")

# Create a test job and proposal
try:
    # Get or create a client user
    client_user, _ = User.objects.get_or_create(
        username='client1',
        defaults={
            'email': 'client1@example.com',
            'first_name': 'Test',
            'last_name': 'Client',
            'password': 'pbkdf2_sha256$600000$test$test'
        }
    )
    
    client_profile, _ = UserProfile.objects.get_or_create(
        user=client_user,
        defaults={
            'user_type': 'client',
            'bio': 'Test client for development'
        }
    )
    
    # Get a category
    category = Category.objects.first()
    if not category:
        category = Category.objects.create(
            name='AI Development & Engineering',
            description='ML model building, NLP, computer vision'
        )
    
    # Create a test job
    job, created = Job.objects.get_or_create(
        title='Test AI Project for Development',
        defaults={
            'description': 'This is a test project for development and testing purposes.',
            'budget_min': 1000,
            'budget_max': 2000,
            'job_type': 'fixed',
            'experience_level': 'intermediate',
            'location': 'Remote',
            'deadline': datetime.now() + timedelta(days=30),
            'skills_required': 'Python, Machine Learning, TensorFlow',
            'category': category,
            'client': client_user
        }
    )
    
    if created:
        print(f"Created test job: {job.title}")
    
    # Create a test proposal
    proposal, created = Proposal.objects.get_or_create(
        job=job,
        freelancer=user,
        defaults={
            'cover_letter': 'I am interested in working on this test project. I have experience with Python and machine learning.',
            'proposed_price': 1500,
            'delivery_time': 20,
            'status': 'accepted'
        }
    )
    
    if created:
        print(f"Created test proposal: {proposal.id}")
        print(f"Proposal status: {proposal.status}")
    else:
        print(f"Test proposal already exists: {proposal.id}")
        print(f"Proposal status: {proposal.status}")
        
    print(f"\nTest data created successfully!")
    print(f"Login as: {username}")
    print(f"Proposal ID: {proposal.id}")
    print(f"Test URL: http://localhost:5174/project-progress.html?proposal={proposal.id}")
    
except Exception as e:
    print(f"Error creating test data: {e}")