#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Order, Gig, Category, UserProfile, Notification
from decimal import Decimal

# Get or create users
try:
    client = User.objects.get(username='client1')
except User.DoesNotExist:
    client = User.objects.create_user(username='client1', email='client1@test.com', password='test123')
    UserProfile.objects.create(user=client, user_type='client')

try:
    freelancer = User.objects.get(username='freelancerkb')
except User.DoesNotExist:
    freelancer = User.objects.create_user(username='freelancerkb', email='freelancer@test.com', password='test123')
    UserProfile.objects.create(user=freelancer, user_type='freelancer')

# Get or create category
category, _ = Category.objects.get_or_create(name='Test Category')

# Get or create gig
gig, _ = Gig.objects.get_or_create(
    freelancer=freelancer,
    category=category,
    title='Test Gig',
    defaults={
        'description': 'Test gig description',
        'basic_title': 'Basic Package',
        'basic_description': 'Basic package description',
        'basic_price': Decimal('100.00'),
        'basic_delivery_time': 3
    }
)

# Create test order
order, created = Order.objects.get_or_create(
    client=client,
    freelancer=freelancer,
    gig=gig,
    defaults={
        'title': 'Test Order',
        'description': 'Test order description',
        'package_type': 'basic',
        'price': Decimal('100.00'),
        'delivery_time': 3,
        'status': 'in_progress'
    }
)

print(f"Order created: {created}, Order ID: {order.id}")
print(f"Client: {order.client.username}, Freelancer: {order.freelancer.username}")

# Test the notification creation directly
from api.views import update_order_status
from django.test import RequestFactory
from rest_framework.authtoken.models import Token

# Create token for freelancer
token, _ = Token.objects.get_or_create(user=freelancer)

# Create a mock request
factory = RequestFactory()
request = factory.post(f'/api/orders/{order.id}/update-status/', {
    'status': 'in_progress',
    'message': 'Test progress update'
}, content_type='application/json')
request.user = freelancer

# Test the view
try:
    response = update_order_status(request, order.id)
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.data}")
except Exception as e:
    print(f"Error: {e}")

# Check notifications
notifications = Notification.objects.filter(user=client)
print(f"Notifications for client: {notifications.count()}")
for notif in notifications:
    print(f"- {notif.title}: {notif.message}")