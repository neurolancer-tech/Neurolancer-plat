import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Conversation, Message

# Get users
users = User.objects.all()
if len(users) < 2:
    print("Need at least 2 users to create conversations")
    exit()

# Create sample conversations
conversations_created = 0

for i in range(min(3, len(users) - 1)):
    user1 = users[0]  # First user
    user2 = users[i + 1]  # Other users
    
    # Create conversation
    conversation = Conversation.objects.create()
    conversation.participants.add(user1, user2)
    
    # Create sample messages
    messages = [
        (user1, "Hi! I'm interested in your AI services."),
        (user2, "Hello! Thanks for reaching out. What kind of project are you working on?"),
        (user1, "I need help with a machine learning model for image classification."),
        (user2, "That sounds interesting! I have experience with computer vision. What's your timeline?"),
        (user1, "I'm looking to get this done within 2 weeks. What would be your rate?"),
        (user2, "For a project like this, I typically charge $750. Would you like to discuss the details?")
    ]
    
    for j, (sender, content) in enumerate(messages):
        Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=content,
            created_at=datetime.now() - timedelta(minutes=30-j*5)
        )
    
    conversations_created += 1
    print(f"Created conversation between {user1.username} and {user2.username}")

print(f"\nCreated {conversations_created} sample conversations with messages!")
print("You can now test the messaging system.")