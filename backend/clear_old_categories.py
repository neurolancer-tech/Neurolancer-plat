import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import Category

# Old categories to remove
old_categories = [
    'Machine Learning',
    'Computer Vision', 
    'Natural Language Processing',
    'Data Science',
    'Automation',
    'AI Security'
]

# Remove old categories
for cat_name in old_categories:
    try:
        category = Category.objects.get(name=cat_name)
        category.delete()
        print(f"Deleted category: {cat_name}")
    except Category.DoesNotExist:
        print(f"Category not found: {cat_name}")

print("Old categories removed successfully!")