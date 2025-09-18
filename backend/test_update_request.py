#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Order, Notification

# Get the existing order
order = Order.objects.get(id=1)
print(f"Testing update request for Order: {order.title}")
print(f"Client: {order.client.username}, Freelancer: {order.freelancer.username}")

# Simulate client requesting update
client_name = f"{order.client.first_name} {order.client.last_name}".strip() or order.client.username
update_message = "Could you please provide an update on the current progress? I'd like to know what has been completed so far."

notification = Notification.objects.create(
    user=order.freelancer,
    title=f"Update Requested: {order.title}",
    message=f"{client_name} requested an update on '{order.title}': {update_message}",
    notification_type='order',
    action_url=f'/orders',
    related_object_id=order.id
)

print(f"Created update request notification: {notification.id}")
print(f"Title: {notification.title}")
print(f"Message: {notification.message}")

# Check notifications for freelancer
freelancer_notifications = Notification.objects.filter(user=order.freelancer).count()
print(f"Total notifications for {order.freelancer.username}: {freelancer_notifications}")

# Check notifications for client
client_notifications = Notification.objects.filter(user=order.client).count()
print(f"Total notifications for {order.client.username}: {client_notifications}")