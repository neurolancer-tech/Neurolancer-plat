import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, Job, Proposal, Category
from datetime import datetime, timedelta

try:
    # Get the existing freelancerkb user
    user = User.objects.get(username='freelancerkb')
    print(f"Found user: {user.username}")
    
    # Get or create a client for the job
    client_user, _ = User.objects.get_or_create(
        username='client1',
        defaults={
            'email': 'client1@example.com',
            'first_name': 'Test',
            'last_name': 'Client',
            'password': 'pbkdf2_sha256$600000$test$test'
        }
    )
    
    # Get or create category
    category, _ = Category.objects.get_or_create(
        name='AI Development & Engineering',
        defaults={'description': 'ML model building, NLP, computer vision'}
    )
    
    # Create a job for the proposal
    job, created = Job.objects.get_or_create(
        title='Test Project for FreelancerKB',
        defaults={
            'description': 'This is a test project to demonstrate the project progress functionality.',
            'budget_min': 1000,
            'budget_max': 2000,
            'job_type': 'fixed',
            'experience_level': 'intermediate',
            'location': 'Remote',
            'deadline': datetime.now() + timedelta(days=30),
            'skills_required': 'Python, Machine Learning, AI',
            'category': category,
            'client': client_user
        }
    )
    
    # Create an accepted proposal for freelancerkb
    proposal, created = Proposal.objects.get_or_create(
        job=job,
        freelancer=user,
        defaults={
            'cover_letter': 'I am excited to work on this project and deliver high-quality results.',
            'proposed_price': 1500,
            'delivery_time': 20,
            'status': 'accepted'
        }
    )
    
    if created:
        print(f"Created accepted proposal with ID: {proposal.id}")
    else:
        # Update existing proposal to accepted
        proposal.status = 'accepted'
        proposal.save()
        print(f"Updated existing proposal to accepted, ID: {proposal.id}")
    
    print(f"\nSuccess! You can now test:")
    print(f"- My Projects: http://localhost:5174/my-projects.html")
    print(f"- Project Progress: http://localhost:5174/project-progress.html?proposal={proposal.id}")
    
except User.DoesNotExist:
    print("User 'freelancerkb' not found. Please register this user first.")
except Exception as e:
    print(f"Error: {e}")