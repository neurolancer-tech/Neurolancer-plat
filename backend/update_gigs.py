import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import Category, Gig, User

# Remove all existing gigs
Gig.objects.all().delete()
print("Deleted all existing gigs")

# Create new gigs for each category
gigs_data = [
    # AI Development & Engineering
    {
        'title': 'Custom Neural Network Development',
        'description': 'Build custom neural networks and deep learning models using TensorFlow, PyTorch, and Keras for your specific use case',
        'basic_price': 800,
        'basic_delivery_time': 10,
        'category': 'AI Development & Engineering',
        'freelancer': 'alex_chen'
    },
    {
        'title': 'Computer Vision AI Solutions',
        'description': 'Develop image recognition, object detection, and facial recognition systems using OpenCV and modern CNN architectures',
        'basic_price': 1200,
        'basic_delivery_time': 14,
        'category': 'AI Development & Engineering',
        'freelancer': 'sarah_martinez'
    },
    
    # Data & Model Management
    {
        'title': 'ML Data Pipeline Creation',
        'description': 'Design and implement robust data pipelines for machine learning workflows with automated data cleaning and preprocessing',
        'basic_price': 600,
        'basic_delivery_time': 7,
        'category': 'Data & Model Management',
        'freelancer': 'david_kumar'
    },
    {
        'title': 'Model Fine-tuning & Optimization',
        'description': 'Optimize existing ML models for better performance, accuracy, and efficiency through hyperparameter tuning and architecture improvements',
        'basic_price': 500,
        'basic_delivery_time': 5,
        'category': 'Data & Model Management',
        'freelancer': 'emily_rodriguez'
    },
    
    # AI Ethics, Law & Governance
    {
        'title': 'AI Bias Audit & Assessment',
        'description': 'Comprehensive bias testing and fairness evaluation of your AI systems with detailed reports and recommendations',
        'basic_price': 750,
        'basic_delivery_time': 8,
        'category': 'AI Ethics, Law & Governance',
        'freelancer': 'alex_chen'
    },
    {
        'title': 'AI Compliance Documentation',
        'description': 'Create GDPR, CCPA, and industry-specific compliance documentation for AI systems and data processing workflows',
        'basic_price': 400,
        'basic_delivery_time': 6,
        'category': 'AI Ethics, Law & Governance',
        'freelancer': 'sarah_martinez'
    },
    
    # AI Integration & Support
    {
        'title': 'Chatbot Development & Deployment',
        'description': 'Build and deploy intelligent chatbots with NLP capabilities for customer service, support, and business automation',
        'basic_price': 650,
        'basic_delivery_time': 9,
        'category': 'AI Integration & Support',
        'freelancer': 'david_kumar'
    },
    {
        'title': 'AI Workflow Automation',
        'description': 'Integrate AI solutions into existing business processes and workflows for improved efficiency and automation',
        'basic_price': 550,
        'basic_delivery_time': 7,
        'category': 'AI Integration & Support',
        'freelancer': 'emily_rodriguez'
    },
    
    # Creative & Industry-Specific AI
    {
        'title': 'AI Art & Design Generation',
        'description': 'Create AI-powered art generation tools and design automation systems using GANs and diffusion models',
        'basic_price': 900,
        'basic_delivery_time': 12,
        'category': 'Creative & Industry-Specific AI',
        'freelancer': 'alex_chen'
    },
    {
        'title': 'Healthcare AI Solutions',
        'description': 'Develop AI applications for healthcare including medical image analysis, diagnosis assistance, and patient data processing',
        'basic_price': 1500,
        'basic_delivery_time': 21,
        'category': 'Creative & Industry-Specific AI',
        'freelancer': 'sarah_martinez'
    },
    
    # AI Operations in New Markets
    {
        'title': 'Agricultural AI Systems',
        'description': 'Build AI solutions for precision agriculture including crop monitoring, yield prediction, and automated farming systems',
        'basic_price': 1100,
        'basic_delivery_time': 16,
        'category': 'AI Operations in New Markets',
        'freelancer': 'david_kumar'
    },
    {
        'title': 'Energy Optimization AI',
        'description': 'Develop AI systems for energy management, smart grid optimization, and renewable energy forecasting',
        'basic_price': 1300,
        'basic_delivery_time': 18,
        'category': 'AI Operations in New Markets',
        'freelancer': 'emily_rodriguez'
    }
]

# Create new gigs
for gig_data in gigs_data:
    try:
        category = Category.objects.get(name=gig_data['category'])
        freelancer = User.objects.get(username=gig_data['freelancer'])
        
        gig = Gig.objects.create(
            title=gig_data['title'],
            description=gig_data['description'],
            basic_title='Basic Package',
            basic_description=gig_data['description'],
            basic_price=gig_data['basic_price'],
            basic_delivery_time=gig_data['basic_delivery_time'],
            category=category,
            freelancer=freelancer
        )
        print(f"Created gig: {gig.title}")
    except Exception as e:
        print(f"Error creating gig {gig_data['title']}: {e}")

print("New gigs created successfully!")