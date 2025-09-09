import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import Gig
from decimal import Decimal
import random

# Update all gigs with proper data
gigs = Gig.objects.all()

for gig in gigs:
    # Set random rating between 4.0 and 5.0
    gig.rating = Decimal(str(round(random.uniform(4.0, 5.0), 1)))
    
    # Set random review count between 5 and 50
    gig.total_reviews = random.randint(5, 50)
    
    # Set random order count between 10 and 100
    gig.total_orders = random.randint(10, 100)
    
    # Ensure standard and premium packages exist
    if not gig.standard_title:
        gig.standard_title = "Standard Package"
        gig.standard_description = f"Enhanced version of {gig.title.lower()} with additional features"
        gig.standard_price = gig.basic_price * Decimal('1.5')
        gig.standard_delivery_time = gig.basic_delivery_time + 3
    
    if not gig.premium_title:
        gig.premium_title = "Premium Package"
        gig.premium_description = f"Complete {gig.title.lower()} solution with full support and customization"
        gig.premium_price = gig.basic_price * Decimal('2.5')
        gig.premium_delivery_time = gig.basic_delivery_time + 7
    
    gig.save()
    print(f"Updated gig: {gig.title} - Rating: {gig.rating}, Reviews: {gig.total_reviews}")

print("All gigs updated successfully!")