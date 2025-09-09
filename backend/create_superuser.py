import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User

# Create superuser if it doesn't exist
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@neurolancer.com', 'admin123')
    print("Superuser 'admin' created with password 'admin123'")
else:
    print("Superuser 'admin' already exists")