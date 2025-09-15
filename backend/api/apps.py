from django.apps import AppConfig
from django.core.management import call_command


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        try:
            call_command('populate_subcategories')
        except Exception as e:
            print(f"Error populating subcategories: {e}")
