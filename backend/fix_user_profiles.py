#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import UserProfile
from django.contrib.auth.models import User

def fix_user_profiles():
    print("=== Fixing User Profiles ===")
    
    # Get all users without profiles
    users_without_profiles = User.objects.filter(userprofile__isnull=True)
    print(f"Found {users_without_profiles.count()} users without profiles")
    
    created_count = 0
    for user in users_without_profiles:
        # Determine user type based on their activity
        has_gigs = user.gigs.exists()
        has_orders_as_client = user.client_orders.exists()
        
        if has_gigs and has_orders_as_client:
            user_type = 'both'
        elif has_gigs:
            user_type = 'freelancer'
        elif has_orders_as_client:
            user_type = 'client'
        else:
            user_type = 'client'  # Default
        
        # Create UserProfile
        profile = UserProfile.objects.create(
            user=user,
            user_type=user_type,
            bio=f'Profile for {user.get_full_name() or user.username}',
            rating=4.0,
            total_reviews=0,
            completed_gigs=0,
            email_verified=True  # Assume existing users are verified
        )
        
        print(f"Created {user_type} profile for {user.username}")
        created_count += 1
    
    print(f"\nCreated {created_count} user profiles")
    
    # Verify all users now have profiles
    total_users = User.objects.count()
    users_with_profiles = User.objects.filter(userprofile__isnull=False).count()
    print(f"Total users: {total_users}")
    print(f"Users with profiles: {users_with_profiles}")
    
    if total_users == users_with_profiles:
        print("✅ All users now have profiles!")
    else:
        print("❌ Some users still missing profiles")

if __name__ == "__main__":
    fix_user_profiles()