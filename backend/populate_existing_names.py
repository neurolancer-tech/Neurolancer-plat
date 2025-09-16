#!/usr/bin/env python3

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import Gig, Job, UserProfile, Assessment, Course

def populate_existing_names():
    """Populate category_name and subcategory_names for existing records"""
    
    print("Populating Category and Subcategory Names for Existing Records")
    print("=" * 60)
    
    # Update Gigs
    print("\n=== Updating Gigs ===")
    gigs = Gig.objects.all()
    updated_gigs = 0
    
    for gig in gigs:
        updated = False
        
        # Update category name
        if gig.category and not gig.category_name:
            gig.category_name = gig.category.name
            updated = True
        
        # Update subcategory names
        if gig.subcategories.exists() and not gig.subcategory_names:
            subcategory_names = [sub.name for sub in gig.subcategories.all()]
            gig.subcategory_names = ', '.join(subcategory_names)
            updated = True
        
        if updated:
            gig.save()
            updated_gigs += 1
            print(f"[OK] Updated gig: {gig.title}")
    
    print(f"[SUCCESS] Updated {updated_gigs} gigs")
    
    # Update Jobs
    print("\n=== Updating Jobs ===")
    jobs = Job.objects.all()
    updated_jobs = 0
    
    for job in jobs:
        updated = False
        
        # Update category name
        if job.category and not job.category_name:
            job.category_name = job.category.name
            updated = True
        
        # Update subcategory names
        if job.subcategories.exists() and not job.subcategory_names:
            subcategory_names = [sub.name for sub in job.subcategories.all()]
            job.subcategory_names = ', '.join(subcategory_names)
            updated = True
        
        if updated:
            job.save()
            updated_jobs += 1
            print(f"[OK] Updated job: {job.title}")
    
    print(f"[SUCCESS] Updated {updated_jobs} jobs")
    
    # Update UserProfiles
    print("\n=== Updating User Profiles ===")
    profiles = UserProfile.objects.all()
    updated_profiles = 0
    
    for profile in profiles:
        updated = False
        
        # Update primary category name
        if profile.primary_category and not profile.primary_category_name:
            profile.primary_category_name = profile.primary_category.name
            updated = True
        
        # Update category names
        if profile.categories.exists() and not profile.category_names:
            category_names = [cat.name for cat in profile.categories.all()]
            profile.category_names = ', '.join(category_names)
            updated = True
        
        # Update subcategory names
        if profile.subcategories.exists() and not profile.subcategory_names:
            subcategory_names = [sub.name for sub in profile.subcategories.all()]
            profile.subcategory_names = ', '.join(subcategory_names)
            updated = True
        
        if updated:
            profile.save()
            updated_profiles += 1
            print(f"[OK] Updated profile: {profile.user.username}")
    
    print(f"[SUCCESS] Updated {updated_profiles} user profiles")
    
    # Update Assessments
    print("\n=== Updating Assessments ===")
    assessments = Assessment.objects.all()
    updated_assessments = 0
    
    for assessment in assessments:
        updated = False
        
        # Update category name
        if assessment.category and not assessment.category_name:
            assessment.category_name = assessment.category.name
            updated = True
        
        # Update subcategory names
        if assessment.subcategories.exists() and not assessment.subcategory_names:
            subcategory_names = [sub.name for sub in assessment.subcategories.all()]
            assessment.subcategory_names = ', '.join(subcategory_names)
            updated = True
        
        if updated:
            assessment.save()
            updated_assessments += 1
            print(f"[OK] Updated assessment: {assessment.title}")
    
    print(f"[SUCCESS] Updated {updated_assessments} assessments")
    
    # Update Courses
    print("\n=== Updating Courses ===")
    courses = Course.objects.all()
    updated_courses = 0
    
    for course in courses:
        updated = False
        
        # Update category name
        if course.category and not course.category_name:
            course.category_name = course.category.name
            updated = True
        
        # Update subcategory names
        if course.subcategories.exists() and not course.subcategory_names:
            subcategory_names = [sub.name for sub in course.subcategories.all()]
            course.subcategory_names = ', '.join(subcategory_names)
            updated = True
        
        if updated:
            course.save()
            updated_courses += 1
            print(f"[OK] Updated course: {course.title}")
    
    print(f"[SUCCESS] Updated {updated_courses} courses")
    
    print("\n" + "=" * 60)
    print("[SUCCESS] All existing records have been updated!")
    print(f"[SUCCESS] Total updates: {updated_gigs + updated_jobs + updated_profiles + updated_assessments + updated_courses}")
    print("[SUCCESS] Frontend will now display proper subcategory names for all records")
    
    return True

if __name__ == '__main__':
    try:
        success = populate_existing_names()
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Population failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)