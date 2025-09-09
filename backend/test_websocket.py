#!/usr/bin/env python
"""
Test WebSocket connection to verify real-time messaging setup
"""
import asyncio
import websockets
import json
import sys
import os

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_websocket():
    """Test WebSocket connection with a sample token"""
    
    # You'll need to replace this with a real token from your database
    # You can get one by logging in through the frontend or creating one manually
    test_token = "your_test_token_here"
    
    uri = f"ws://localhost:8000/ws/messages/?token={test_token}"
    
    try:
        print(f"Connecting to: {uri}")
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connection established!")
            
            # Send a test message
            test_message = {
                "type": "join_conversation",
                "conversation_id": 1
            }
            
            await websocket.send(json.dumps(test_message))
            print(f"📤 Sent: {test_message}")
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📥 Received: {response}")
            except asyncio.TimeoutError:
                print("⏰ No response received within 5 seconds")
            
            print("✅ WebSocket test completed successfully!")
            
    except websockets.exceptions.ConnectionClosed as e:
        print(f"❌ WebSocket connection closed: {e}")
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"❌ Invalid status code: {e}")
        if e.status_code == 403:
            print("   This usually means authentication failed")
        elif e.status_code == 404:
            print("   WebSocket endpoint not found - check URL routing")
    except ConnectionRefusedError:
        print("❌ Connection refused - is the server running on port 8000?")
        print("   Start the server with: python run_realtime_server.py")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def get_test_token():
    """Get a test token from the database"""
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
    django.setup()
    
    from rest_framework.authtoken.models import Token
    from django.contrib.auth.models import User
    
    try:
        # Try to get the first user's token
        user = User.objects.first()
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return token.key
        else:
            print("❌ No users found in database")
            print("   Create a user first or run: python manage.py createsuperuser")
            return None
    except Exception as e:
        print(f"❌ Error getting token: {e}")
        return None

if __name__ == "__main__":
    print("🔧 WebSocket Connection Test")
    print("=" * 40)
    
    # Get a real token from the database
    token = get_test_token()
    if not token:
        print("❌ Could not get test token")
        sys.exit(1)
    
    print(f"🔑 Using token: {token[:10]}...")
    
    # Run the test with real token
    async def run_test():
        uri = f"ws://localhost:8000/ws/messages/?token={token}"
        
        try:
            print(f"Connecting to: {uri}")
            async with websockets.connect(uri) as websocket:
                print("✅ WebSocket connection established!")
                
                # Send a test message
                test_message = {
                    "type": "join_conversation",
                    "conversation_id": 1
                }
                
                await websocket.send(json.dumps(test_message))
                print(f"📤 Sent: {test_message}")
                
                # Wait for response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    print(f"📥 Received: {response}")
                except asyncio.TimeoutError:
                    print("⏰ No response received within 5 seconds")
                
                print("✅ WebSocket test completed successfully!")
                
        except websockets.exceptions.ConnectionClosed as e:
            print(f"❌ WebSocket connection closed: {e}")
        except websockets.exceptions.InvalidStatusCode as e:
            print(f"❌ Invalid status code: {e}")
            if e.status_code == 403:
                print("   This usually means authentication failed")
            elif e.status_code == 404:
                print("   WebSocket endpoint not found - check URL routing")
        except ConnectionRefusedError:
            print("❌ Connection refused - is the server running on port 8000?")
            print("   Start the server with: python run_realtime_server.py")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
    
    asyncio.run(run_test())