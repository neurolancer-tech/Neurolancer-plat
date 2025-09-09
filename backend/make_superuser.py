#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User

def make_superuser():
    email = 'kbrian1237@gmail.com'
    
    try:
        user = User.objects.get(email=email)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print(f"SUCCESS: User {email} is now a superuser!")
        print(f"   - Username: {user.username}")
        print(f"   - Is superuser: {user.is_superuser}")
        print(f"   - Is staff: {user.is_staff}")
    except User.DoesNotExist:
        print(f"ERROR: User with email {email} not found!")
        print("   Please make sure the user is registered first.")

if __name__ == '__main__':
    make_superuser()