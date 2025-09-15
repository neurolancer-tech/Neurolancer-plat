from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .location_service import LocationService
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def get_location_by_coordinates(request):
    """Get location data by coordinates"""
    try:
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if not latitude or not longitude:
            return Response({
                'success': False,
                'message': 'Latitude and longitude are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = LocationService.get_location_by_coordinates(float(latitude), float(longitude))
        
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response({
            'success': False,
            'message': 'Invalid latitude or longitude format'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Location API error: {e}")
        return Response({
            'success': False,
            'message': 'Location service error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_location_by_ip(request):
    """Get location data by IP address"""
    try:
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        result = LocationService.get_location_by_ip(ip)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"IP Location API error: {e}")
        return Response({
            'success': False,
            'message': 'IP location service error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)