#!/usr/bin/env python
"""
Script to fix message ordering in the database.
Run this after updating the Message model ordering.
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.core.management import execute_from_command_line

if __name__ == '__main__':
    print("Creating migration for Message model ordering fix...")
    execute_from_command_line(['manage.py', 'makemigrations', 'api', '--name', 'fix_message_ordering'])
    
    print("Applying migration...")
    execute_from_command_line(['manage.py', 'migrate'])
    
    print("Message ordering fixed successfully!")