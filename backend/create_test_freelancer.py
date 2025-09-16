#!/usr/bin/env python3

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Category, Subcategory, UserProfile, FreelancerProfile

def create_test_freelancer():
    """Create a test freelancer with categories and subcategories"""
    
    print("Creating Test Freelancer with Categories")
    print("=" * 40)
    
    # Create test user
    user, created = User.objects.get_or_create(
        username='test_freelancer_with_cats',
        defaults={
            'email': 'freelancer@test.com',
            'first_name': 'Test',
            'last_name': 'Freelancer'
        }
    )
    
    # Create user profile
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={'user_type': 'freelancer'}
    )
    
    # Add categories and subcategories
    ai_category = Category.objects.filter(name__icontains='AI Development').first()
    if ai_category:
        profile.primary_category = ai_category
        profile.primary_category_name = ai_category.name
        profile.categories.add(ai_category)
        profile.category_names = ai_category.name
        
        subcategories = Subcategory.objects.filter(category=ai_category)[:2]
        if subcategories:
            profile.subcategories.set(subcategories)
            profile.subcategory_names = ', '.join([sub.name for sub in subcategories])
        
        profile.save()
        print(f"[OK] Added categories to UserProfile: {profile.category_names}")
        print(f"[OK] Added subcategories to UserProfile: {profile.subcategory_names}")
    
    # Create freelancer profile
    freelancer_profile, created = FreelancerProfile.objects.get_or_create(
        user=user,
        defaults={
            'user_profile': profile,
            'title': 'AI Developer',
            'bio': 'Experienced AI developer specializing in machine learning',
            'hourly_rate': 75.00,
            'skills': 'Python, TensorFlow, Machine Learning',
            'experience_years': 5,
            'is_active': True
        }
    )
    
    if created:
        print(f"[OK] Created FreelancerProfile: {freelancer_profile.title}")
    else:
        print(f"[OK] FreelancerProfile already exists: {freelancer_profile.title}")
    
    print("\n" + "=" * 40)
    print("[SUCCESS] Test freelancer created successfully!")
    
    return True

if __name__ == '__main__':
    try:
        success = create_test_freelancer()
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Creation failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)