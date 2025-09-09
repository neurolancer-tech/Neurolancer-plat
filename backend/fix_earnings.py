#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Order
from django.db.models import Sum

# Fix kekkomorfkb's earnings
try:
    user = User.objects.get(username='kekkomorfkb')
    print(f"User: {user.username}")
    
    # Check completed orders
    completed_orders = Order.objects.filter(freelancer=user, status='completed')
    actual_earnings = completed_orders.aggregate(total=Sum('price'))['total'] or 0
    
    print(f"Before fix:")
    print(f"  Profile total_earnings: ${user.userprofile.total_earnings}")
    print(f"  Profile available_balance: ${user.userprofile.available_balance}")
    print(f"  Actual earnings from completed orders: ${actual_earnings}")
    
    # Update profile with correct earnings
    user.userprofile.total_earnings = actual_earnings
    user.userprofile.available_balance = actual_earnings  # Assume all earnings are available
    user.userprofile.completed_gigs = completed_orders.count()
    user.userprofile.save()
    
    print(f"\nAfter fix:")
    print(f"  Profile total_earnings: ${user.userprofile.total_earnings}")
    print(f"  Profile available_balance: ${user.userprofile.available_balance}")
    print(f"  Completed gigs: {user.userprofile.completed_gigs}")
    print(f"SUCCESS: Profile updated with correct earnings!")

except User.DoesNotExist:
    print("User 'kekkomorfkb' not found")
except Exception as e:
    print(f"Error: {e}")