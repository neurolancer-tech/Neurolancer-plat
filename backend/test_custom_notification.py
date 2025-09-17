#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.ticket_models import SupportTicket
from api.notification_service import NotificationService
from api.models import Notification

def test_custom_notification():
    print("Testing Custom Notification System...")
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )
    if created:
        print(f"Created test user: {user.username}")
    else:
        print(f"Using existing user: {user.username}")
    
    # Create a test ticket
    ticket, created = SupportTicket.objects.get_or_create(
        user=user,
        subject='Test Custom Notification',
        defaults={
            'description': 'This is a test ticket for custom notifications',
            'category': 'technical_issue',
            'priority': 'medium',
            'status': 'open'
        }
    )
    if created:
        print(f"Created test ticket: {ticket.ticket_id}")
    else:
        print(f"Using existing ticket: {ticket.ticket_id}")
    
    # Test custom notification
    custom_message = "Hello! This is a custom notification from our support team. We've reviewed your ticket and wanted to provide you with a personalized update. Thank you for your patience!"
    
    print(f"Sending custom notification to user: {user.username}")
    NotificationService.send_ticket_notification(
        ticket=ticket,
        action='custom_reply',
        message=custom_message
    )
    
    # Check if notification was created
    notifications = Notification.objects.filter(
        user=user,
        notification_type='support',
        title__icontains='Support Update'
    ).order_by('-created_at')
    
    if notifications.exists():
        latest_notification = notifications.first()
        print(f"[SUCCESS] Custom notification created successfully!")
        print(f"   Title: {latest_notification.title}")
        print(f"   Message: {latest_notification.message}")
        print(f"   Type: {latest_notification.notification_type}")
        print(f"   Created: {latest_notification.created_at}")
        return True
    else:
        print("[ERROR] Custom notification was not created")
        return False

if __name__ == '__main__':
    success = test_custom_notification()
    if success:
        print("\n[SUCCESS] Custom notification system is working correctly!")
    else:
        print("\n[ERROR] Custom notification system needs debugging")