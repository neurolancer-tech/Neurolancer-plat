#!/usr/bin/env python
"""
Real-time server runner for Django with WebSocket support
"""
import os
import sys
import subprocess

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
    
    print("Starting Django ASGI server with WebSocket support...")
    print("Server will be available at: http://localhost:8000")
    print("WebSocket endpoint: ws://localhost:8000/ws/messages/")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Try to use daphne for ASGI support
        subprocess.run([
            sys.executable, '-m', 'daphne', 
            '-p', '8000',
            'neurolancer_backend.asgi:application'
        ], check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("\nWarning: daphne not found. Installing...")
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'daphne==4.0.0'], check=True)
            print("daphne installed successfully. Starting server...")
            subprocess.run([
                sys.executable, '-m', 'daphne', 
                '-p', '8000',
                'neurolancer_backend.asgi:application'
            ], check=True)
        except subprocess.CalledProcessError:
            print("\nFalling back to Django runserver (WebSockets will not work)")
            print("To enable WebSockets, install daphne: pip install daphne")
            subprocess.run([sys.executable, 'manage.py', 'runserver', '8000'])

if __name__ == '__main__':
    main()