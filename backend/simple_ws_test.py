#!/usr/bin/env python
import asyncio
import websockets
import json
import sys
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User

async def test_websocket():
    # Get a real token
    try:
        user = User.objects.first()
        if not user:
            print("No users found")
            return
        
        token, created = Token.objects.get_or_create(user=user)
        print(f"Using token: {token.key[:10]}...")
        
        uri = f"ws://localhost:8000/ws/messages/?token={token.key}"
        print(f"Connecting to: {uri}")
        
        async with websockets.connect(uri) as websocket:
            print("WebSocket connected successfully!")
            
            # Wait for connection message
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            print(f"Received: {response}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())