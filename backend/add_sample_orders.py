import os
import django
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Category, Gig, Order, UserProfile

# Create sample orders for existing users
users = User.objects.all()
gigs = Gig.objects.all()

if not gigs.exists():
    print("No gigs found. Please run populate_db.py first.")
    exit()

# Create sample orders with different statuses and dates
order_statuses = ['pending', 'in_progress', 'delivered', 'completed', 'cancelled']
sample_orders = []

for i in range(30):  # Create 30 sample orders
    # Random client and gig
    client = random.choice([u for u in users if u.userprofile.user_type in ['client', 'both']])
    gig = random.choice(gigs)
    freelancer = gig.freelancer
    
    # Random date within last 6 months
    days_ago = random.randint(1, 180)
    created_date = datetime.now() - timedelta(days=days_ago)
    
    # Random package type and corresponding price
    package_types = ['basic', 'standard', 'premium']
    package_type = random.choice(package_types)
    
    if package_type == 'basic':
        price = gig.basic_price
        delivery_time = gig.basic_delivery_time
        title = gig.basic_title
        description = gig.basic_description
    elif package_type == 'standard' and gig.standard_price:
        price = gig.standard_price
        delivery_time = gig.standard_delivery_time
        title = gig.standard_title
        description = gig.standard_description
    else:
        price = gig.basic_price
        delivery_time = gig.basic_delivery_time
        title = gig.basic_title
        description = gig.basic_description
    
    # Random status
    status = random.choice(order_statuses)
    
    # Create order
    order = Order.objects.create(
        client=client,
        freelancer=freelancer,
        gig=gig,
        package_type=package_type,
        title=title,
        description=description,
        price=price,
        delivery_time=delivery_time,
        status=status,
        requirements=f"Sample requirements for {title}",
        is_paid=status != 'pending',
        created_at=created_date
    )
    
    # Set completion dates for completed orders
    if status == 'completed':
        order.completed_at = created_date + timedelta(days=delivery_time)
        order.delivered_at = order.completed_at - timedelta(days=1)
        order.save()
        
        # Update freelancer earnings
        freelancer.userprofile.total_earnings += price
        freelancer.userprofile.save()
    
    sample_orders.append(order)
    print(f"Created order #{order.id}: {title} - ${price} ({status})")

print(f"\nCreated {len(sample_orders)} sample orders!")
print("Charts will now show real data from the database.")