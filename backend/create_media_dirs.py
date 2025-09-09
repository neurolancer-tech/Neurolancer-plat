#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.conf import settings

def create_media_directories():
    """Create media directories for file uploads"""
    
    media_dirs = [
        'message_attachments',
        'profile_pics',
        'gig_images',
        'deliverables',
        'portfolio'
    ]
    
    for dir_name in media_dirs:
        dir_path = os.path.join(settings.MEDIA_ROOT, dir_name)
        os.makedirs(dir_path, exist_ok=True)
        print(f"Created directory: {dir_path}")
    
    print(f"\nMedia root: {settings.MEDIA_ROOT}")
    print(f"Media URL: {settings.MEDIA_URL}")
    print("All media directories created successfully!")

if __name__ == '__main__':
    create_media_directories()