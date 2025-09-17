#!/usr/bin/env python
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import Client
from api.ticket_models import SupportTicket
from api.models import Notification

def test_admin_custom_notification_api():
    print("Testing Admin Custom Notification API...")
    
    # Create test client
    client = Client()
    
    # Get or create admin user
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@neurolancer.com',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"Created admin user: {admin_user.username}")
    else:
        print(f"Using existing admin user: {admin_user.username}")
    
    # Get or create regular user
    user, created = User.objects.get_or_create(
        username='testuser2',
        defaults={
            'email': 'test2@example.com',
            'first_name': 'Test',
            'last_name': 'User2'
        }
    )
    if created:
        print(f"Created test user: {user.username}")
    else:
        print(f"Using existing user: {user.username}")
    
    # Create test ticket
    ticket = SupportTicket.objects.create(
        user=user,
        subject='API Test Custom Notification',
        description='Testing custom notification via API',
        category='technical_issue',
        priority='high',
        status='open'
    )
    print(f"Created test ticket: {ticket.ticket_id}")
    
    # Login as admin
    login_success = client.login(username='admin', password='admin123')
    if not login_success:
        print("[ERROR] Failed to login as admin")
        return False
    
    print("Admin logged in successfully")
    
    # Test custom notification API endpoint
    custom_message = "This is a custom notification sent via the admin API. Your issue has been escalated to our senior technical team for immediate attention."
    
    response = client.post(
        f'/api/admin/tickets/{ticket.id}/custom-notification/',
        data=json.dumps({'message': custom_message}),
        content_type='application/json'
    )
    
    print(f"API Response Status: {response.status_code}")
    print(f"API Response Content: {response.content.decode()}")
    
    if response.status_code == 200:
        # Check if notification was created
        notifications = Notification.objects.filter(
            user=user,
            notification_type='support',
            message=custom_message
        ).order_by('-created_at')
        
        if notifications.exists():
            notification = notifications.first()
            print("[SUCCESS] Custom notification created via API!")
            print(f"   Title: {notification.title}")
            print(f"   Message: {notification.message}")
            print(f"   User: {notification.user.username}")
            print(f"   Created: {notification.created_at}")
            return True
        else:
            print("[ERROR] Notification not found in database")
            return False
    else:
        print(f"[ERROR] API call failed with status {response.status_code}")
        return False

def test_ticket_reply_with_custom_notification():
    print("\nTesting Ticket Reply with Custom Notification...")
    
    client = Client()
    
    # Login as admin
    client.login(username='admin', password='admin123')
    
    # Get the test ticket
    ticket = SupportTicket.objects.filter(subject='API Test Custom Notification').first()
    if not ticket:
        print("[ERROR] Test ticket not found")
        return False
    
    # Send a regular reply
    reply_data = {
        'message': 'Thank you for contacting support. We have received your ticket and are working on it.'
    }
    
    response = client.post(
        f'/api/admin/tickets/{ticket.id}/reply/',
        data=json.dumps(reply_data),
        content_type='application/json'
    )
    
    print(f"Reply API Response Status: {response.status_code}")
    
    if response.status_code == 201:
        print("[SUCCESS] Ticket reply sent successfully!")
        
        # Check if reply notification was created
        notifications = Notification.objects.filter(
            user=ticket.user,
            notification_type='support',
            title__icontains='Support Response'
        ).order_by('-created_at')
        
        if notifications.exists():
            notification = notifications.first()
            print(f"   Reply notification created: {notification.title}")
            return True
        else:
            print("[ERROR] Reply notification not created")
            return False
    else:
        print(f"[ERROR] Reply API failed with status {response.status_code}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("TESTING ADMIN CUSTOM NOTIFICATION SYSTEM")
    print("=" * 60)
    
    # Test 1: Custom notification API
    test1_success = test_admin_custom_notification_api()
    
    # Test 2: Regular reply with notification
    test2_success = test_ticket_reply_with_custom_notification()
    
    print("\n" + "=" * 60)
    print("TEST RESULTS:")
    print("=" * 60)
    print(f"Custom Notification API: {'PASS' if test1_success else 'FAIL'}")
    print(f"Reply with Notification: {'PASS' if test2_success else 'FAIL'}")
    
    if test1_success and test2_success:
        print("\n[SUCCESS] All tests passed! Custom notification system is fully functional.")
    else:
        print("\n[ERROR] Some tests failed. Please check the implementation.")