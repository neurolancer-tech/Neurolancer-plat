#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create superuser
email = 'kbrian1237@gmail.com'
password = 'k2189114'

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(
        email=email,
        password=password,
        first_name='Admin',
        last_name='User',
        user_type='both'
    )
    print(f'Superuser created: {email}')
else:
    print(f'Superuser already exists: {email}')