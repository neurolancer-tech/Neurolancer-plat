#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer.settings')
django.setup()

from api.models import Gig, UserProfile
from api.serializers import GigListSerializer

def debug_production_gigs():
    print("=== DEBUGGING PRODUCTION GIGS ===")
    
    # Check all gigs
    all_gigs = Gig.objects.all()
    print(f"Total gigs in database: {all_gigs.count()}")
    
    # Check active gigs
    active_gigs = Gig.objects.filter(is_active=True)
    print(f"Active gigs: {active_gigs.count()}")
    
    # List all gigs with details
    for gig in all_gigs:
        print(f"\nGig ID: {gig.id}")
        print(f"  Title: {gig.title}")
        print(f"  Is Active: {gig.is_active}")
        print(f"  Freelancer: {gig.freelancer.username if gig.freelancer else 'None'}")
        
        # Check if freelancer has profile
        if gig.freelancer:
            try:
                profile = gig.freelancer.userprofile
                print(f"  Freelancer Profile: EXISTS (rating: {profile.rating})")
            except UserProfile.DoesNotExist:
                print(f"  Freelancer Profile: MISSING!")
        
        # Test serialization for this specific gig
        try:
            serializer = GigListSerializer(gig)
            serialized_data = serializer.data
            print(f"  Serialization: SUCCESS")
        except Exception as e:
            print(f"  Serialization: FAILED - {e}")
    
    # Test the exact queryset used by GigListView
    print(f"\n=== TESTING GIGLISTVIEW QUERYSET ===")
    queryset = Gig.objects.filter(is_active=True)
    print(f"Queryset count: {queryset.count()}")
    
    # Test serialization of the queryset
    try:
        serializer = GigListSerializer(queryset, many=True)
        serialized_data = serializer.data
        print(f"Queryset serialization: SUCCESS - {len(serialized_data)} items")
        
        if serialized_data:
            print("First serialized gig keys:", list(serialized_data[0].keys()))
    except Exception as e:
        print(f"Queryset serialization: FAILED - {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_production_gigs()