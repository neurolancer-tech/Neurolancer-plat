#!/usr/bin/env python
"""
Script to populate category_name and subcategory_names fields for existing records.
This ensures backward compatibility and proper display of subcategory names.
Uses the correct categories and subcategories from the landing page.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import Gig, Job, Course, Assessment, UserProfile, Category, Subcategory

# Categories and subcategories from the landing page
CATEGORIES_DATA = {
    "AI Development & Engineering": {
        "icon": "🧠",
        "description": "ML model building, NLP, computer vision.",
        "subcategories": [
            'Machine Learning Development',
            'Deep Learning Models',
            'Natural Language Processing',
            'Computer Vision',
            'AI Model Optimization',
            'Reinforcement Learning',
            'AI Research & Development',
            'AI Algorithm Development',
            'AI System Architecture',
            'AI Testing & Validation'
        ]
    },
    "Data & Model Management": {
        "icon": "🗃️",
        "description": "Data cleaning, labeling, pipelines, fine-tuning.",
        "subcategories": [
            'Data Annotation & Labeling',
            'Data Cleaning & Preprocessing',
            'Data Pipeline Development',
            'Model Training & Tuning',
            'Model Deployment & Monitoring',
            'MLOps & DevOps',
            'Data Visualization',
            'Statistical Analysis',
            'Database Management',
            'Big Data Processing'
        ]
    },
    "AI Ethics, Law & Governance": {
        "icon": "⚖️",
        "description": "Compliance, bias auditing, responsible AI.",
        "subcategories": [
            'AI Ethics & Bias Auditing',
            'AI Policy & Regulation',
            'AI Safety & Security',
            'AI Compliance & Standards',
            'AI Risk Assessment',
            'AI Transparency & Explainability',
            'AI Privacy & Data Protection',
            'AI Legal Consulting',
            'AI Governance Framework',
            'AI Impact Assessment'
        ]
    },
    "AI Integration & Support": {
        "icon": "🔌",
        "description": "Chatbot deployment, workflow automation.",
        "subcategories": [
            'AI Integration & Implementation',
            'AI Consulting & Strategy',
            'AI Training & Education',
            'AI Technical Writing',
            'AI Project Management',
            'AI Quality Assurance',
            'AI Customer Support',
            'AI Sales & Marketing',
            'AI Business Analysis',
            'AI Product Management'
        ]
    },
    "Creative & Industry-Specific AI": {
        "icon": "🎨",
        "description": "AI in music, art, design, healthcare, finance.",
        "subcategories": [
            'AI Content Creation',
            'AI Art & Design',
            'AI Music & Audio',
            'AI Gaming & Entertainment',
            'AI Healthcare Applications',
            'AI Finance & Trading',
            'AI Automotive & Robotics',
            'AI Agriculture & Environment',
            'AI Education Technology',
            'AI Social Media & Marketing'
        ]
    },
    "AI Operations in New Markets": {
        "icon": "🌍",
        "description": "AI in agriculture, energy, logistics.",
        "subcategories": [
            'AI Startup Consulting',
            'AI Investment Analysis',
            'AI Market Research',
            'AI Competitive Intelligence',
            'AI Business Development',
            'AI Partnership Strategy',
            'AI Innovation Management',
            'AI Venture Capital',
            'AI Technology Transfer',
            'AI Ecosystem Development'
        ]
    }
}

def ensure_categories_exist():
    """Ensure all categories and subcategories exist in the database"""
    print("Ensuring categories and subcategories exist...")
    
    for category_name, category_data in CATEGORIES_DATA.items():
        # Create or get category
        category, created = Category.objects.get_or_create(
            name=category_name,
            defaults={
                'description': category_data['description'],
                'icon': category_data['icon']
            }
        )
        
        if created:
            print(f"Created category: {category_name}")
        
        # Create subcategories
        for subcategory_name in category_data['subcategories']:
            subcategory, created = Subcategory.objects.get_or_create(
                category=category,
                name=subcategory_name,
                defaults={'description': f"{subcategory_name} services"}
            )
            
            if created:
                print(f"Created subcategory: {subcategory_name}")

def populate_gig_names():
    """Populate category_name and subcategory_names for existing gigs"""
    print("Populating gig category and subcategory names...")
    
    gigs = Gig.objects.all()
    updated_count = 0
    
    for gig in gigs:
        updated = False
        
        # Populate category name
        if gig.category and not gig.category_name:
            gig.category_name = gig.category.name
            updated = True
        
        # Populate subcategory names
        if gig.subcategories.exists() and not gig.subcategory_names:
            subcategory_names = [sub.name for sub in gig.subcategories.all()]
            gig.subcategory_names = ', '.join(subcategory_names)
            updated = True
        
        if updated:
            gig.save()
            updated_count += 1
    
    print(f"Updated {updated_count} gigs")

def populate_job_names():
    """Populate category_name and subcategory_names for existing jobs"""
    print("Populating job category and subcategory names...")
    
    jobs = Job.objects.all()
    updated_count = 0
    
    for job in jobs:
        updated = False
        
        # Populate category name
        if job.category and not job.category_name:
            job.category_name = job.category.name
            updated = True
        
        # Populate subcategory names
        if job.subcategories.exists() and not job.subcategory_names:
            subcategory_names = [sub.name for sub in job.subcategories.all()]
            job.subcategory_names = ', '.join(subcategory_names)
            updated = True
        
        if updated:
            job.save()
            updated_count += 1
    
    print(f"Updated {updated_count} jobs")

def populate_course_names():
    """Populate category_name and subcategory_names for existing courses"""
    print("Populating course category and subcategory names...")
    
    courses = Course.objects.all()
    updated_count = 0
    
    for course in courses:
        updated = False
        
        # Populate category name
        if course.category and not course.category_name:
            course.category_name = course.category.name
            updated = True
        
        # Populate subcategory names
        if course.subcategories.exists() and not course.subcategory_names:
            subcategory_names = [sub.name for sub in course.subcategories.all()]
            course.subcategory_names = ', '.join(subcategory_names)
            updated = True
        
        if updated:
            course.save()
            updated_count += 1
    
    print(f"Updated {updated_count} courses")

def populate_assessment_names():
    """Populate category_name and subcategory_names for existing assessments"""
    print("Populating assessment category and subcategory names...")
    
    assessments = Assessment.objects.all()
    updated_count = 0
    
    for assessment in assessments:
        updated = False
        
        # Populate category name
        if assessment.category and not assessment.category_name:
            assessment.category_name = assessment.category.name
            updated = True
        
        # Populate subcategory names
        if assessment.subcategories.exists() and not assessment.subcategory_names:
            subcategory_names = [sub.name for sub in assessment.subcategories.all()]
            assessment.subcategory_names = ', '.join(subcategory_names)
            updated = True
        
        if updated:
            assessment.save()
            updated_count += 1
    
    print(f"Updated {updated_count} assessments")

def populate_userprofile_names():
    """Populate category and subcategory names for existing user profiles"""
    print("Populating user profile category and subcategory names...")
    
    profiles = UserProfile.objects.all()
    updated_count = 0
    
    for profile in profiles:
        updated = False
        
        # Populate primary category name
        if profile.primary_category and not profile.primary_category_name:
            profile.primary_category_name = profile.primary_category.name
            updated = True
        
        # Populate category names
        if profile.categories.exists() and not profile.category_names:
            category_names = [cat.name for cat in profile.categories.all()]
            profile.category_names = ', '.join(category_names)
            updated = True
        
        # Populate subcategory names
        if profile.subcategories.exists() and not profile.subcategory_names:
            subcategory_names = [sub.name for sub in profile.subcategories.all()]
            profile.subcategory_names = ', '.join(subcategory_names)
            updated = True
        
        if updated:
            profile.save()
            updated_count += 1
    
    print(f"Updated {updated_count} user profiles")

def main():
    """Main function to populate all category and subcategory names"""
    print("Starting category and subcategory name population...")
    print("=" * 50)
    
    try:
        # First ensure all categories and subcategories exist
        ensure_categories_exist()
        
        # Then populate the name fields
        populate_gig_names()
        populate_job_names()
        populate_course_names()
        populate_assessment_names()
        populate_userprofile_names()
        
        print("=" * 50)
        print("Successfully populated all category and subcategory names!")
        
    except Exception as e:
        print(f"Error during population: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()