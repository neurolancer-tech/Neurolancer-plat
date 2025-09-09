#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Order
from django.db.models import Sum

# Check kekkomorfkb's earnings
try:
    user = User.objects.get(username='kekkomorfkb')
    print(f"User: {user.username}")
    print(f"Profile total_earnings: ${user.userprofile.total_earnings}")
    print(f"Profile available_balance: ${user.userprofile.available_balance}")
    
    # Check completed orders
    completed_orders = Order.objects.filter(freelancer=user, status='completed')
    print(f"Completed orders count: {completed_orders.count()}")
    
    # Calculate total earnings from completed orders
    actual_earnings = completed_orders.aggregate(total=Sum('price'))['total'] or 0
    print(f"Calculated earnings from completed orders: ${actual_earnings}")
    
    # List all orders
    all_orders = Order.objects.filter(freelancer=user).order_by('-created_at')
    print(f"\nAll orders for {user.username}:")
    for order in all_orders:
        print(f"  Order {order.id}: {order.title} - Status: {order.status} - Price: ${order.price}")
        if order.gig:
            print(f"    Gig: {order.gig.title}")
        if order.completed_at:
            print(f"    Completed: {order.completed_at}")
    
    # Check if there's a mismatch
    if user.userprofile.total_earnings != actual_earnings:
        print(f"\n⚠️  MISMATCH DETECTED!")
        print(f"Profile shows: ${user.userprofile.total_earnings}")
        print(f"Actual should be: ${actual_earnings}")
        
        # Update profile
        user.userprofile.total_earnings = actual_earnings
        user.userprofile.save()
        print(f"✅ Updated profile total_earnings to ${actual_earnings}")
    else:
        print(f"\n✅ Profile earnings match calculated earnings: ${actual_earnings}")

except User.DoesNotExist:
    print("User 'kekkomorfkb' not found")
except Exception as e:
    print(f"Error: {e}")