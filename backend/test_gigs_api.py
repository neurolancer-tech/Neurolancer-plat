#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import Gig, UserProfile
from api.serializers import GigListSerializer
from django.contrib.auth.models import User

def test_gigs_api():
    print("=== Testing Gigs API ===")
    
    # Check total gigs
    total_gigs = Gig.objects.count()
    active_gigs = Gig.objects.filter(is_active=True).count()
    print(f"Total gigs: {total_gigs}")
    print(f"Active gigs: {active_gigs}")
    
    if active_gigs == 0:
        print("No active gigs found!")
        return
    
    # Test first gig
    gig = Gig.objects.filter(is_active=True).first()
    print(f"\nTesting gig: {gig.title}")
    print(f"Freelancer: {gig.freelancer.username}")
    
    # Check if freelancer has UserProfile
    try:
        profile = gig.freelancer.userprofile
        print(f"Freelancer profile exists: {profile}")
        print(f"Profile rating: {profile.rating}")
        print(f"Profile reviews: {profile.total_reviews}")
    except UserProfile.DoesNotExist:
        print("ERROR: Freelancer has no UserProfile!")
        # Create a UserProfile for the freelancer
        profile = UserProfile.objects.create(
            user=gig.freelancer,
            user_type='freelancer',
            bio='Test freelancer profile',
            rating=4.5,
            total_reviews=10,
            completed_gigs=5
        )
        print(f"Created UserProfile for {gig.freelancer.username}")
    
    # Test serializer
    try:
        serializer = GigListSerializer(gig)
        data = serializer.data
        print(f"\nSerialization successful!")
        print(f"Freelancer profile data: {data.get('freelancer_profile')}")
    except Exception as e:
        print(f"Serialization error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test all gigs serialization
    try:
        gigs = Gig.objects.filter(is_active=True)
        serializer = GigListSerializer(gigs, many=True)
        data = serializer.data
        print(f"\nAll gigs serialization successful! Count: {len(data)}")
    except Exception as e:
        print(f"All gigs serialization error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_gigs_api()