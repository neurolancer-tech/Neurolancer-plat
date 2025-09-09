import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Job, Proposal

# Get test user
try:
    testuser = User.objects.get(username='testuser')
    print(f"Found test user: {testuser.username}")
except User.DoesNotExist:
    print("Test user not found. Please run create_test_user.py first.")
    exit()

# Get some jobs to create proposals for
jobs = Job.objects.all()[:3]

proposals_data = [
    {
        'cover_letter': 'I have extensive experience in AI chatbot development and would love to work on this project. I can deliver a high-quality solution within your timeline.',
        'proposed_price': 2500,
        'delivery_time': 28,
        'status': 'pending'
    },
    {
        'cover_letter': 'As a computer vision expert, I have worked on similar quality control systems. I can provide a robust solution with high accuracy.',
        'proposed_price': 6000,
        'delivery_time': 42,
        'status': 'accepted'
    },
    {
        'cover_letter': 'I specialize in data science dashboards and marketing analytics. I can create an interactive solution with predictive capabilities.',
        'proposed_price': 2000,
        'delivery_time': 20,
        'status': 'rejected'
    }
]

for i, job in enumerate(jobs):
    if i < len(proposals_data):
        proposal_data = proposals_data[i]
        
        proposal, created = Proposal.objects.get_or_create(
            job=job,
            freelancer=testuser,
            defaults={
                'cover_letter': proposal_data['cover_letter'],
                'proposed_price': proposal_data['proposed_price'],
                'delivery_time': proposal_data['delivery_time'],
                'status': proposal_data['status']
            }
        )
        
        if created:
            print(f"Created proposal for job: {job.title[:50]}... (Status: {proposal.status})")
        else:
            print(f"Proposal already exists for job: {job.title[:50]}...")

print("Test proposals created successfully!")