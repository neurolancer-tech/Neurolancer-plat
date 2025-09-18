#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Order, Notification

# Get the existing order
try:
    order = Order.objects.get(id=1)
    print(f"Found order: {order.id}, Client: {order.client.username}")
    
    # Create notification directly
    notification = Notification.objects.create(
        user=order.client,
        title=f"Order Update: {order.title}",
        message="Test progress update from freelancer",
        notification_type='order',
        action_url=f'/orders/{order.id}',
        related_object_id=order.id
    )
    
    print(f"Created notification: {notification.id}")
    
    # Check all notifications for client
    notifications = Notification.objects.filter(user=order.client)
    print(f"Total notifications for {order.client.username}: {notifications.count()}")
    for n in notifications:
        print(f"- {n.title}: {n.message}")
        
except Order.DoesNotExist:
    print("No order found")