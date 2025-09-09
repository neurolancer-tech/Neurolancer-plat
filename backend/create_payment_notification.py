import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Notification, Proposal

try:
    # Get the client and proposal
    client = User.objects.get(username='client1')
    proposal = Proposal.objects.get(freelancer__username='freelancerkb')
    
    # Create a payment request notification for the client
    notification = Notification.objects.create(
        user=client,
        title=f"Payment Request: {proposal.job.title}",
        message=f"Payment request for ${proposal.proposed_price} from {proposal.freelancer.first_name or proposal.freelancer.username}. Project completed and ready for payment.",
        notification_type='payment',
        related_object_id=proposal.id
    )
    
    print(f"Created payment notification for client1")
    print(f"Notification ID: {notification.id}")
    print(f"Proposal ID: {proposal.id}")
    print(f"Login as client1 to see the payment notification")
    
except Exception as e:
    print(f"Error: {e}")