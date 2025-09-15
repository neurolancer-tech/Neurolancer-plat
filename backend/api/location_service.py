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
        Get location by IP address with multiple fallback options
        
        Args:
            ip_address (str): IP address (optional, uses client IP if not provided)
            
        Returns:
            dict: Location data
        """
        # Try multiple free IP geolocation services
        services = [
            {
                'url': 'https://api.bigdatacloud.net/data/client-ip',
                'parser': cls._parse_bigdatacloud_free
            },
            {
                'url': 'http://ip-api.com/json/',
                'parser': cls._parse_ipapi
            },
            {
                'url': 'https://ipapi.co/json/',
                'parser': cls._parse_ipapi_co
            }
        ]
        
        for service in services:
            try:
                logger.info(f"Trying IP location service: {service['url']}")
                
                url = service['url']
                if ip_address and 'ip-api.com' in url:
                    url = f"http://ip-api.com/json/{ip_address}"
                elif ip_address and 'ipapi.co' in url:
                    url = f"https://ipapi.co/{ip_address}/json/"
                
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                
                data = response.json()
                logger.info(f"Raw API response: {data}")
                
                result = service['parser'](data)
                if result['success']:
                    logger.info(f"Successfully got location: {result}")
                    return result
                    
            except Exception as e:
                logger.error(f"Service {service['url']} failed: {e}")
                continue
        
        return {
            'success': False,
            'error': 'All IP location services failed',
            'message': 'Could not determine location from IP'
        }
    
    @classmethod
    def _parse_bigdatacloud_free(cls, data: dict) -> dict:
        """Parse BigDataCloud free API response"""
        try:
            return {
                'success': True,
                'country': data.get('countryName', ''),
                'country_code': data.get('countryCode', ''),
                'state': data.get('principalSubdivision', ''),
                'city': data.get('city', ''),
                'ip_address': data.get('ipString', ''),
                'raw_data': data
            }
        except Exception:
            return {'success': False}
    
    @classmethod
    def _parse_ipapi(cls, data: dict) -> dict:
        """Parse ip-api.com response"""
        try:
            if data.get('status') == 'fail':
                return {'success': False}
            
            return {
                'success': True,
                'country': data.get('country', ''),
                'country_code': data.get('countryCode', ''),
                'state': data.get('regionName', ''),
                'city': data.get('city', ''),
                'ip_address': data.get('query', ''),
                'raw_data': data
            }
        except Exception:
            return {'success': False}
    
    @classmethod
    def _parse_ipapi_co(cls, data: dict) -> dict:
        """Parse ipapi.co response"""
        try:
            return {
                'success': True,
                'country': data.get('country_name', ''),
                'country_code': data.get('country_code', ''),
                'state': data.get('region', ''),
                'city': data.get('city', ''),
                'ip_address': data.get('ip', ''),
                'raw_data': data
            }
        except Exception:
            return {'success': False}