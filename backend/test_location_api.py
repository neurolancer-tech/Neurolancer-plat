#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.location_service import LocationService

def test_location_services():
    print("🧪 Testing Location Services...")
    
    # Test IP-based location
    print("\n📍 Testing IP-based location...")
    ip_result = LocationService.get_location_by_ip()
    print(f"IP Result: {ip_result}")
    
    # Test coordinates-based location (New York City)
    print("\n🗽 Testing coordinates-based location (NYC)...")
    coord_result = LocationService.get_location_by_coordinates(40.7128, -74.0060)
    print(f"Coordinates Result: {coord_result}")
    
    # Test coordinates-based location (London)
    print("\n🇬🇧 Testing coordinates-based location (London)...")
    london_result = LocationService.get_location_by_coordinates(51.5074, -0.1278)
    print(f"London Result: {london_result}")

if __name__ == "__main__":
    test_location_services()