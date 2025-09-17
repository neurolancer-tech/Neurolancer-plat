from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Gig, UserProfile
from .serializers import GigListSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def debug_gigs(request):
    """Debug endpoint to check gig data and serialization"""
    try:
        # Get all gigs
        all_gigs = Gig.objects.all()
        active_gigs = Gig.objects.filter(is_active=True)
        
        debug_info = {
            'total_gigs': all_gigs.count(),
            'active_gigs': active_gigs.count(),
            'gigs_details': []
        }
        
        # Check each gig
        for gig in all_gigs:
            gig_info = {
                'id': gig.id,
                'title': gig.title,
                'is_active': gig.is_active,
                'freelancer_username': gig.freelancer.username if gig.freelancer else None,
                'has_freelancer_profile': False,
                'serialization_error': None
            }
            
            # Check freelancer profile
            if gig.freelancer:
                try:
                    profile = gig.freelancer.userprofile
                    gig_info['has_freelancer_profile'] = True
                    gig_info['freelancer_rating'] = float(profile.rating)
                except UserProfile.DoesNotExist:
                    gig_info['has_freelancer_profile'] = False
            
            # Test serialization
            try:
                serializer = GigListSerializer(gig)
                serialized_data = serializer.data
                gig_info['serialization_success'] = True
            except Exception as e:
                gig_info['serialization_success'] = False
                gig_info['serialization_error'] = str(e)
            
            debug_info['gigs_details'].append(gig_info)
        
        # Test the exact queryset used by GigListView
        try:
            queryset = Gig.objects.filter(is_active=True)
            serializer = GigListSerializer(queryset, many=True)
            serialized_data = serializer.data
            debug_info['queryset_serialization'] = {
                'success': True,
                'count': len(serialized_data)
            }
        except Exception as e:
            debug_info['queryset_serialization'] = {
                'success': False,
                'error': str(e)
            }
        
        return Response(debug_info)
        
    except Exception as e:
        return Response({
            'error': str(e),
            'type': type(e).__name__
        }, status=500)