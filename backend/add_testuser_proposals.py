import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Job, Proposal

# Get testuser
try:
    testuser = User.objects.get(username='testuser')
    print(f"Found testuser: {testuser.username}")
except User.DoesNotExist:
    print("Testuser not found")
    exit()

# Get jobs to create proposals for
jobs = Job.objects.all()[:3]

# Create proposals for testuser
for i, job in enumerate(jobs):
    proposal, created = Proposal.objects.get_or_create(
        job=job,
        freelancer=testuser,
        defaults={
            'cover_letter': f'I am very interested in this {job.title} project. I have relevant experience and can deliver quality work.',
            'proposed_price': job.budget_min + 200,
            'delivery_time': 20 + (i * 5),
            'status': ['pending', 'accepted', 'rejected'][i % 3]
        }
    )
    
    if created:
        print(f"Created proposal for testuser: {job.title[:50]}...")
    else:
        print(f"Proposal already exists: {job.title[:50]}...")

print("Testuser proposals created!")