import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile

# Create a client user for testing
client_user, created = User.objects.get_or_create(
    username='client_test',
    defaults={
        'email': 'client@test.com',
        'first_name': 'John',
        'last_name': 'Client',
        'password': 'pbkdf2_sha256$600000$test$test'
    }
)

if created:
    profile, _ = UserProfile.objects.get_or_create(
        user=client_user,
        defaults={
            'user_type': 'client',
            'bio': 'Test client user for dashboard testing'
        }
    )
    print(f"Created client user: {client_user.username}")
else:
    print(f"Client user already exists: {client_user.username}")

print("You can now login as:")
print("Username: client_test")
print("Password: test123")