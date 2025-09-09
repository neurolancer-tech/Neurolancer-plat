#!/usr/bin/env python
"""
Script to update completed_gigs count for existing freelancers
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import UserProfile, Order

def update_completed_gigs():
    """Update completed_gigs count for all freelancers"""
    print("Updating completed_gigs count for all freelancers...")
    
    freelancer_profiles = UserProfile.objects.filter(user_type__in=['freelancer', 'both'])
    updated_count = 0
    
    for profile in freelancer_profiles:
        # Count completed orders for this freelancer
        completed_orders = Order.objects.filter(
            freelancer=profile.user,
            status='completed'
        ).count()
        
        # Update the profile
        profile.completed_gigs = completed_orders
        profile.save()
        
        updated_count += 1
        print(f"Updated {profile.user.username}: {completed_orders} completed gigs")
    
    print(f"\nSuccessfully updated {updated_count} freelancer profiles")

if __name__ == '__main__':
    update_completed_gigs()