#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.ticket_models import SupportTicket, TicketReply

def test_ticket_system():
    print("Testing Ticket System...")
    
    # Create test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    print(f"Test user: {user.username} (created: {created})")
    
    # Create support ticket
    ticket = SupportTicket.objects.create(
        user=user,
        subject="Test Ticket",
        description="This is a test ticket for the support system",
        category="technical",
        priority="medium"
    )
    print(f"Created ticket: {ticket.ticket_id} - {ticket.subject}")
    
    # Add reply
    reply = TicketReply.objects.create(
        ticket=ticket,
        user=user,
        message="This is a test reply to the ticket"
    )
    print(f"Added reply: {reply.message[:50]}...")
    
    # Test ticket retrieval
    tickets = SupportTicket.objects.filter(user=user)
    print(f"User has {tickets.count()} tickets")
    
    # Test reply retrieval
    replies = TicketReply.objects.filter(ticket=ticket)
    print(f"Ticket has {replies.count()} replies")
    
    print("SUCCESS: Ticket system test completed successfully!")
    return True

if __name__ == "__main__":
    try:
        test_ticket_system()
    except Exception as e:
        print(f"FAILED: Test failed: {e}")
        sys.exit(1)