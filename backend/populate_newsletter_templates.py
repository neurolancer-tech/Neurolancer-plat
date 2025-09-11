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
from api.models import NewsletterTemplate

def populate_newsletter_templates():
    """Populate newsletter templates from HTML files into the database"""
    
    # Get or create admin user for template creation
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@neurolancer.com',
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    templates_data = [
        {
            'name': 'Professional Clean',
            'template_type': 'weekly_digest',
            'description': 'Clean and professional template with gradient header and white logo',
            'file': 'newsletter_template_1.html'
        },
        {
            'name': 'Feature Highlight',
            'template_type': 'featured_content',
            'description': 'Template with feature boxes and card-based design',
            'file': 'newsletter_template_2.html'
        },
        {
            'name': 'Modern Announcement',
            'template_type': 'announcement',
            'description': 'Modern template for announcements and updates',
            'file': 'newsletter_template_3.html'
        },
        {
            'name': 'Promotional Campaign',
            'template_type': 'promotional',
            'description': 'Eye-catching template for promotional campaigns',
            'file': 'newsletter_template_4.html'
        }
    ]
    
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates', 'emails')
    
    for template_data in templates_data:
        template_file = os.path.join(templates_dir, template_data['file'])
        
        if os.path.exists(template_file):
            with open(template_file, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # Create or update template
            template, created = NewsletterTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults={
                    'template_type': template_data['template_type'],
                    'description': template_data['description'],
                    'html_content': html_content,
                    'is_active': True,
                    'is_default': template_data['name'] == 'Professional Clean',
                    'created_by': admin_user
                }
            )
            
            if created:
                print(f"Created template: {template_data['name']}")
            else:
                # Update existing template
                template.html_content = html_content
                template.description = template_data['description']
                template.template_type = template_data['template_type']
                template.save()
                print(f"Updated template: {template_data['name']}")
        else:
            print(f"Template file not found: {template_file}")
    
    print(f"\nTotal templates in database: {NewsletterTemplate.objects.count()}")

if __name__ == '__main__':
    print("Populating newsletter templates...")
    populate_newsletter_templates()
    print("Newsletter templates population completed!")