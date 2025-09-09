from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Category

class Command(BaseCommand):
    help = 'Setup database with admin user and basic data'

    def handle(self, *args, **options):
        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@neurolancer.com',
                'is_staff': True,
                'is_superuser': True,
                'first_name': 'Admin',
                'last_name': 'User'
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('✅ Admin user created'))
        else:
            self.stdout.write(self.style.WARNING('ℹ️ Admin user exists'))
        
        # Create basic categories
        categories = [
            'AI Development & Engineering',
            'Data & Model Management', 
            'AI Ethics, Law & Governance',
            'AI Integration & Support',
            'Creative & Industry-Specific AI',
            'AI Operations in New Markets'
        ]
        
        for cat_name in categories:
            category, created = Category.objects.get_or_create(
                name=cat_name,
                defaults={'description': f'{cat_name} services'}
            )
            if created:
                self.stdout.write(f'✅ Created category: {cat_name}')
        
        self.stdout.write(self.style.SUCCESS('Database setup complete!'))
        self.stdout.write('Admin login: admin/admin123')