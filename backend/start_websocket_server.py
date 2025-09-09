#!/usr/bin/env python
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
    django.setup()
    
    print("Starting Django ASGI server with WebSocket support...")
    print("Server: http://localhost:8000")
    print("WebSocket: ws://localhost:8000/ws/messages/")
    print("Press Ctrl+C to stop")
    print("-" * 50)
    
    # Use daphne directly for ASGI/WebSocket support
    import subprocess
    subprocess.run([sys.executable, '-m', 'daphne', '-p', '8000', 'neurolancer_backend.asgi:application'])