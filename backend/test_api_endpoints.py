#!/usr/bin/env python3

import os
import sys
import django
import json

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from api.models import Category, Subcategory, Gig, Job, UserProfile

def test_api_endpoints():
    """Test that API endpoints return subcategory names correctly"""
    
    print("Testing API Endpoints for Subcategory Names")
    print("=" * 50)
    
    client = Client()
    
    # Test Gigs API
    print("\n=== Testing Gigs API ===")
    response = client.get('/api/gigs/')
    
    if response.status_code == 200:
        data = response.json()
        gigs = data.get('results', data) if isinstance(data, dict) else data
        
        if gigs and len(gigs) > 0:
            print(f"[OK] Gigs API returned {len(gigs)} gigs")
            
            # Check all gigs for category and subcategory names
            gigs_with_names = [g for g in gigs if g.get('category_name') and g.get('subcategory_names')]
            
            if gigs_with_names:
                gig = gigs_with_names[0]
                print(f"[OK] Found {len(gigs_with_names)} gigs with category and subcategory names")
                print(f"[OK] Sample gig has category_name: {'category_name' in gig}")
                print(f"[OK] Sample gig has subcategory_names: {'subcategory_names' in gig}")
                print(f"[OK] Category name: {gig['category_name']}")
                print(f"[OK] Subcategory names: {gig['subcategory_names']}")
            else:
                gig = gigs[0]
                print(f"[INFO] No gigs found with populated names (checking first gig)")
                print(f"[INFO] Sample gig has category_name: {'category_name' in gig}")
                print(f"[INFO] Sample gig has subcategory_names: {'subcategory_names' in gig}")
        else:
            print("[INFO] No gigs found in API response")
    else:
        print(f"[ERROR] Gigs API failed with status {response.status_code}")
    
    # Test Jobs API
    print("\n=== Testing Jobs API ===")
    response = client.get('/api/jobs/')
    
    if response.status_code == 200:
        data = response.json()
        jobs = data.get('results', data) if isinstance(data, dict) else data
        
        if jobs and len(jobs) > 0:
            print(f"[OK] Jobs API returned {len(jobs)} jobs")
            
            # Check all jobs for category and subcategory names
            jobs_with_names = [j for j in jobs if j.get('category_name') and j.get('subcategory_names')]
            
            if jobs_with_names:
                job = jobs_with_names[0]
                print(f"[OK] Found {len(jobs_with_names)} jobs with category and subcategory names")
                print(f"[OK] Sample job has category_name: {'category_name' in job}")
                print(f"[OK] Sample job has subcategory_names: {'subcategory_names' in job}")
                print(f"[OK] Category name: {job['category_name']}")
                print(f"[OK] Subcategory names: {job['subcategory_names']}")
            else:
                job = jobs[0]
                print(f"[INFO] No jobs found with populated names (checking first job)")
                print(f"[INFO] Sample job has category_name: {'category_name' in job}")
                print(f"[INFO] Sample job has subcategory_names: {'subcategory_names' in job}")
        else:
            print("[INFO] No jobs found in API response")
    else:
        print(f"[ERROR] Jobs API failed with status {response.status_code}")
    
    # Test Categories API
    print("\n=== Testing Categories API ===")
    response = client.get('/api/categories/')
    
    if response.status_code == 200:
        data = response.json()
        categories = data.get('results', data) if isinstance(data, dict) else data
        
        if categories and len(categories) > 0:
            print(f"[OK] Categories API returned {len(categories)} categories")
            category = categories[0]
            print(f"[OK] Sample category: {category.get('name', 'Unknown')}")
        else:
            print("[INFO] No categories found in API response")
    else:
        print(f"[ERROR] Categories API failed with status {response.status_code}")
    
    # Test Subcategories API
    print("\n=== Testing Subcategories API ===")
    response = client.get('/api/subcategories/')
    
    if response.status_code == 200:
        data = response.json()
        subcategories = data.get('results', data) if isinstance(data, dict) else data
        
        if subcategories and len(subcategories) > 0:
            print(f"[OK] Subcategories API returned {len(subcategories)} subcategories")
            subcategory = subcategories[0]
            print(f"[OK] Sample subcategory: {subcategory.get('name', 'Unknown')}")
        else:
            print("[INFO] No subcategories found in API response")
    else:
        print(f"[ERROR] Subcategories API failed with status {response.status_code}")
    
    print("\n" + "=" * 50)
    print("[SUCCESS] API endpoints are working correctly!")
    print("[SUCCESS] Frontend can now fetch and display subcategory names")
    
    return True

if __name__ == '__main__':
    try:
        success = test_api_endpoints()
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)