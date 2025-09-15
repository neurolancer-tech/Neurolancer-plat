import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class LocationService:
    """Location service using BigDataCloud API"""
    
    @classmethod
    def get_location_by_coordinates(cls, latitude: float, longitude: float) -> dict:
        """
        Get location details by coordinates
        
        Args:
            latitude (float): Latitude coordinate
            longitude (float): Longitude coordinate
            
        Returns:
            dict: Location data with country, state, city
        """
        try:
            api_url = getattr(settings, 'LOCATION_API_URL', 'https://api.bigdatacloud.net/data/reverse-geocode-client')
            api_key = getattr(settings, 'LOCATION_API_KEY', None)
            
            params = {
                'latitude': latitude,
                'longitude': longitude,
                'localityLanguage': 'en'
            }
            
            if api_key:
                params['key'] = api_key
            
            response = requests.get(api_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                'success': True,
                'country': data.get('countryName', ''),
                'country_code': data.get('countryCode', ''),
                'state': data.get('principalSubdivision', ''),
                'city': data.get('city', ''),
                'locality': data.get('locality', ''),
                'full_address': data.get('localityInfo', {}).get('administrative', [{}])[0].get('name', ''),
                'raw_data': data
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Location API request failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch location data'
            }
        except Exception as e:
            logger.error(f"Location service error: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Location service error'
            }
    
    @classmethod
    def get_location_by_ip(cls, ip_address: str = None) -> dict:
        """
        Get location by IP address
        
        Args:
            ip_address (str): IP address (optional, uses client IP if not provided)
            
        Returns:
            dict: Location data
        """
        try:
            api_key = getattr(settings, 'LOCATION_API_KEY', None)
            
            if api_key:
                # Use IP geolocation endpoint if API key is available
                url = 'https://api.bigdatacloud.net/data/ip-geolocation'
                params = {'key': api_key}
                if ip_address:
                    params['ip'] = ip_address
            else:
                # Use free endpoint
                url = 'https://api.bigdatacloud.net/data/client-ip'
                params = {}
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                'success': True,
                'country': data.get('country', {}).get('name', ''),
                'country_code': data.get('country', {}).get('isoAlpha2', ''),
                'state': data.get('location', {}).get('principalSubdivision', ''),
                'city': data.get('location', {}).get('city', ''),
                'ip_address': data.get('ipString', ''),
                'raw_data': data
            }
            
        except Exception as e:
            logger.error(f"IP location service error: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'IP location service error'
            }