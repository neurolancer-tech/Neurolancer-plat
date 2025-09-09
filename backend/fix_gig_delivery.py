import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import Gig
import random

# Update delivery times for all gigs
gigs = Gig.objects.all()

delivery_times = [3, 5, 7, 10, 14, 21]  # Various delivery options

for gig in gigs:
    # Set random delivery time
    gig.basic_delivery_time = random.choice(delivery_times)
    gig.standard_delivery_time = gig.basic_delivery_time + random.choice([2, 3, 5])
    gig.premium_delivery_time = gig.basic_delivery_time + random.choice([5, 7, 10])
    
    gig.save()
    print(f"Updated {gig.title}: Basic={gig.basic_delivery_time}, Standard={gig.standard_delivery_time}, Premium={gig.premium_delivery_time} days")

print("Delivery times updated successfully!")