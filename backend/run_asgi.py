#!/usr/bin/env python
"""
Development server runner for Django with ASGI/WebSocket support
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
    
    # For development, we can use Django's runserver with ASGI
    # In production, use daphne or uvicorn
    try:
        from daphne.management.commands.runserver import Command as DaphneRunserver
        # Use daphne if available
        execute_from_command_line(['manage.py', 'runserver', '8000'])
    except ImportError:
        # Fallback to regular Django runserver (WebSockets won't work)
        print("Warning: daphne not installed. WebSockets will not work.")
        print("Install with: pip install daphne")
        execute_from_command_line(['manage.py', 'runserver', '8000'])