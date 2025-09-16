from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Create admin user for Django admin dashboard'

    def handle(self, *args, **options):
        username = 'admin'
        password = 'admin123'
        email = 'admin@neurolancer.com'
        
        try:
            user = User.objects.get(username=username)
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Admin user "{username}" password reset')
            )
        except User.DoesNotExist:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(
                self.style.SUCCESS(f'Admin user "{username}" created successfully')
            )