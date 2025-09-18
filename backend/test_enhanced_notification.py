#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Order, Notification

# Get the existing order
order = Order.objects.get(id=1)
print(f"Testing with Order: {order.title}")
print(f"Client: {order.client.username}, Freelancer: {order.freelancer.username}")

# Test the enhanced notification
freelancer_name = f"{order.freelancer.first_name} {order.freelancer.last_name}".strip() or order.freelancer.username
progress_message = "I've completed the initial setup and started working on the core features. Expected to have a working prototype by next week."

notification = Notification.objects.create(
    user=order.client,
    title=f"Progress Update: {order.title}",
    message=f"{freelancer_name} updated progress on '{order.title}': Work has started on your order\n\nMessage: {progress_message}",
    notification_type='order',
    action_url=f'/orders/{order.id}',
    related_object_id=order.id
)

print(f"Created enhanced notification: {notification.id}")
print(f"Title: {notification.title}")
print(f"Message: {notification.message}")

# Check total notifications for client
total = Notification.objects.filter(user=order.client).count()
print(f"Total notifications for {order.client.username}: {total}")