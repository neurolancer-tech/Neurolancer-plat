import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Category, Gig, UserProfile, Job, Conversation, Message, Proposal
from datetime import datetime, timedelta

# Create categories
categories_data = [
    {'name': 'AI Development & Engineering', 'description': 'ML model building, NLP, computer vision'},
    {'name': 'Data & Model Management', 'description': 'Data cleaning, labeling, pipelines, fine-tuning'},
    {'name': 'AI Ethics, Law & Governance', 'description': 'Compliance, bias auditing, responsible AI'},
    {'name': 'AI Integration & Support', 'description': 'Chatbot deployment, workflow automation'},
    {'name': 'Creative & Industry-Specific AI', 'description': 'AI in music, art, design, healthcare, finance'},
    {'name': 'AI Operations in New Markets', 'description': 'AI in agriculture, energy, logistics'},
]

for cat_data in categories_data:
    category, created = Category.objects.get_or_create(
        name=cat_data['name'],
        defaults={'description': cat_data['description']}
    )
    if created:
        print(f"Created category: {category.name}")

# Create sample users and profiles
users_data = [
    {'username': 'alex_chen', 'email': 'alex@example.com', 'first_name': 'Alex', 'last_name': 'Chen'},
    {'username': 'sarah_martinez', 'email': 'sarah@example.com', 'first_name': 'Sarah', 'last_name': 'Martinez'},
    {'username': 'david_kumar', 'email': 'david@example.com', 'first_name': 'David', 'last_name': 'Kumar'},
    {'username': 'emily_rodriguez', 'email': 'emily@example.com', 'first_name': 'Emily', 'last_name': 'Rodriguez'},
]

for user_data in users_data:
    user, created = User.objects.get_or_create(
        username=user_data['username'],
        defaults={
            'email': user_data['email'],
            'first_name': user_data['first_name'],
            'last_name': user_data['last_name'],
            'password': 'pbkdf2_sha256$600000$test$test'
        }
    )
    if created:
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'user_type': 'freelancer', 'bio': f'Expert {user.first_name} specializing in AI solutions'}
        )
        print(f"Created user: {user.username}")

# Create sample gigs
gigs_data = [
    {
        'title': 'Custom ML Model Development',
        'description': 'I will build custom machine learning models for your business needs using TensorFlow and PyTorch',
        'basic_price': 500,
        'basic_delivery_time': 7,
        'category': 'AI Development & Engineering',
        'freelancer': 'alex_chen'
    },
    {
        'title': 'Data Pipeline & Model Fine-tuning',
        'description': 'Professional data cleaning, labeling, and ML model optimization services',
        'basic_price': 750,
        'basic_delivery_time': 10,
        'category': 'Data & Model Management',
        'freelancer': 'sarah_martinez'
    },
    {
        'title': 'AI Chatbot Integration',
        'description': 'Deploy and integrate intelligent chatbots into your existing workflows',
        'basic_price': 400,
        'basic_delivery_time': 5,
        'category': 'AI Integration & Support',
        'freelancer': 'david_kumar'
    },
    {
        'title': 'AI-Powered Creative Solutions',
        'description': 'Custom AI applications for creative industries including art, music, and design',
        'basic_price': 300,
        'basic_delivery_time': 3,
        'category': 'Creative & Industry-Specific AI',
        'freelancer': 'emily_rodriguez'
    }
]

for gig_data in gigs_data:
    category = Category.objects.get(name=gig_data['category'])
    freelancer = User.objects.get(username=gig_data['freelancer'])
    
    gig, created = Gig.objects.get_or_create(
        title=gig_data['title'],
        defaults={
            'description': gig_data['description'],
            'basic_title': 'Basic Package',
            'basic_description': gig_data['description'],
            'basic_price': gig_data['basic_price'],
            'basic_delivery_time': gig_data['basic_delivery_time'],
            'category': category,
            'freelancer': freelancer
        }
    )
    if created:
        print(f"Created gig: {gig.title}")

# Create sample jobs
jobs_data = [
    {
        'title': 'AI Chatbot Development for E-commerce Platform',
        'description': 'We need an experienced AI developer to create a sophisticated chatbot for our e-commerce platform. The chatbot should handle customer inquiries, product recommendations, and order tracking. Requirements include natural language processing, integration with existing APIs, and multilingual support.',
        'budget_min': 2000,
        'budget_max': 3500,
        'job_type': 'fixed',
        'experience_level': 'intermediate',
        'location': 'Remote',
        'deadline': datetime.now() + timedelta(days=30),
        'skills_required': 'Python, TensorFlow, Natural Language Processing, API Integration, Machine Learning',
        'category': 'AI Development & Engineering',
        'client': 'sarah_martinez'
    },
    {
        'title': 'Computer Vision Model for Quality Control',
        'description': 'Looking for a computer vision expert to develop a model that can detect defects in manufacturing products. The system should integrate with existing production line cameras and provide real-time analysis with 95%+ accuracy.',
        'budget_min': 5000,
        'budget_max': 8000,
        'job_type': 'fixed',
        'experience_level': 'expert',
        'location': 'New York, NY',
        'deadline': datetime.now() + timedelta(days=45),
        'skills_required': 'OpenCV, PyTorch, Computer Vision, Machine Learning, Industrial Automation',
        'category': 'AI Development & Engineering',
        'client': 'david_kumar'
    },
    {
        'title': 'Data Science Dashboard for Marketing Analytics',
        'description': 'Need a data scientist to create an interactive dashboard that analyzes marketing campaign performance and provides actionable insights using machine learning algorithms. Should include predictive analytics and ROI optimization.',
        'budget_min': 1500,
        'budget_max': 2500,
        'job_type': 'fixed',
        'experience_level': 'intermediate',
        'location': 'Remote',
        'deadline': datetime.now() + timedelta(days=21),
        'skills_required': 'Python, Pandas, Plotly, Machine Learning, SQL, Data Visualization',
        'category': 'Data & Model Management',
        'client': 'emily_rodriguez'
    },
    {
        'title': 'AI-Powered Recommendation System for Streaming Platform',
        'description': 'Develop a recommendation engine for our streaming platform that uses collaborative filtering and content-based filtering to suggest personalized content to users. Must handle 1M+ users with real-time recommendations.',
        'budget_min': 3000,
        'budget_max': 4500,
        'job_type': 'fixed',
        'experience_level': 'expert',
        'location': 'San Francisco, CA',
        'deadline': datetime.now() + timedelta(days=60),
        'skills_required': 'Python, Scikit-learn, Collaborative Filtering, AWS, Apache Spark',
        'category': 'AI Development & Engineering',
        'client': 'alex_chen'
    },
    {
        'title': 'AI Ethics Audit and Bias Detection System',
        'description': 'We need an AI ethics expert to audit our existing ML models and develop a bias detection system. This includes creating fairness metrics, identifying potential biases, and implementing mitigation strategies.',
        'budget_min': 2500,
        'budget_max': 4000,
        'job_type': 'fixed',
        'experience_level': 'expert',
        'location': 'Remote',
        'deadline': datetime.now() + timedelta(days=35),
        'skills_required': 'AI Ethics, Fairness Metrics, Bias Detection, Python, Statistical Analysis',
        'category': 'AI Ethics, Law & Governance',
        'client': 'sarah_martinez'
    },
    {
        'title': 'Automated Workflow Integration with AI Assistant',
        'description': 'Looking for someone to integrate an AI assistant into our existing business workflows. The system should automate routine tasks, schedule meetings, and provide intelligent responses to common queries.',
        'budget_min': 1800,
        'budget_max': 3000,
        'job_type': 'fixed',
        'experience_level': 'intermediate',
        'location': 'Remote',
        'deadline': datetime.now() + timedelta(days=28),
        'skills_required': 'Workflow Automation, API Integration, Chatbot Development, Python, REST APIs',
        'category': 'AI Integration & Support',
        'client': 'david_kumar'
    }
]

for job_data in jobs_data:
    category = Category.objects.get(name=job_data['category'])
    client = User.objects.get(username=job_data['client'])
    
    job, created = Job.objects.get_or_create(
        title=job_data['title'],
        defaults={
            'description': job_data['description'],
            'budget_min': job_data['budget_min'],
            'budget_max': job_data['budget_max'],
            'job_type': job_data['job_type'],
            'experience_level': job_data['experience_level'],
            'location': job_data['location'],
            'deadline': job_data['deadline'],
            'skills_required': job_data['skills_required'],
            'category': category,
            'client': client
        }
    )
    if created:
        print(f"Created job: {job.title}")

# Create sample proposals
from api.models import Proposal

jobs = Job.objects.all()
freelancers = User.objects.filter(username__in=['alex_chen', 'david_kumar', 'emily_rodriguez'])

proposals_data = [
    {
        'job_title': 'AI Chatbot Development for E-commerce Platform',
        'freelancer': 'alex_chen',
        'cover_letter': 'I have 5+ years of experience in AI chatbot development and have built similar e-commerce solutions. I can deliver a high-quality chatbot with NLP capabilities, API integrations, and multilingual support.',
        'proposed_price': 2800,
        'delivery_time': 25,
        'status': 'pending'
    },
    {
        'job_title': 'Computer Vision Model for Quality Control',
        'freelancer': 'david_kumar',
        'cover_letter': 'As a computer vision specialist with experience in industrial automation, I can develop an accurate defect detection system. My previous work achieved 97% accuracy in similar manufacturing environments.',
        'proposed_price': 6500,
        'delivery_time': 40,
        'status': 'accepted'
    },
    {
        'job_title': 'Data Science Dashboard for Marketing Analytics',
        'freelancer': 'emily_rodriguez',
        'cover_letter': 'I specialize in creating interactive dashboards and have extensive experience with marketing analytics. I can build a comprehensive solution with predictive analytics and ROI optimization features.',
        'proposed_price': 2200,
        'delivery_time': 18,
        'status': 'pending'
    },
    {
        'job_title': 'AI Ethics Audit and Bias Detection System',
        'freelancer': 'alex_chen',
        'cover_letter': 'I have a strong background in AI ethics and have conducted bias audits for several Fortune 500 companies. I can provide comprehensive fairness metrics and mitigation strategies.',
        'proposed_price': 3200,
        'delivery_time': 30,
        'status': 'rejected'
    }
]

for proposal_data in proposals_data:
    try:
        job = Job.objects.get(title=proposal_data['job_title'])
        freelancer = User.objects.get(username=proposal_data['freelancer'])
        
        proposal, created = Proposal.objects.get_or_create(
            job=job,
            freelancer=freelancer,
            defaults={
                'cover_letter': proposal_data['cover_letter'],
                'proposed_price': proposal_data['proposed_price'],
                'delivery_time': proposal_data['delivery_time'],
                'status': proposal_data['status']
            }
        )
        if created:
            print(f"Created proposal: {freelancer.username} -> {job.title[:50]}...")
    except (Job.DoesNotExist, User.DoesNotExist):
        continue

# Create sample conversations and messages
users = User.objects.all()
if len(users) >= 2:
    user1, user2 = users[0], users[1]
    conversation, created = Conversation.objects.get_or_create(
        conversation_type='direct',
        defaults={}
    )
    if created:
        conversation.participants.add(user1, user2)
        Message.objects.create(
            conversation=conversation,
            sender=user1,
            content="Hi! I saw your AI project and I'm interested in working with you."
        )
        Message.objects.create(
            conversation=conversation,
            sender=user2,
            content="Great! I'd love to discuss the project details with you."
        )
        print(f"Created conversation between {user1.username} and {user2.username}")

print("Database populated successfully!")
print("\nYou can now:")
print("1. Access admin panel: http://localhost:8000/admin (admin/admin123)")
print("2. View API data: http://localhost:8000/api/gigs/")
print("3. View jobs data: http://localhost:8000/api/jobs/")
print("4. Test the frontend with real data")
print("5. Test messages: http://localhost:5174/messages.html")