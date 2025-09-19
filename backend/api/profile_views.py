from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import FreelancerProfile, ClientProfile, UserProfile
from .profile_serializers import FreelancerProfileSerializer, ClientProfileSerializer
import logging

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def freelancer_profile_view(request):
    """Manage freelancer profiles"""
    user = request.user
    user_profile = get_object_or_404(UserProfile, user=user)
    
    if request.method == 'GET':
        try:
            freelancer_profile = FreelancerProfile.objects.get(user=user)
            serializer = FreelancerProfileSerializer(freelancer_profile)
            return Response({
                'success': True,
                'profile': serializer.data,
                'exists': True
            })
        except FreelancerProfile.DoesNotExist:
            return Response({
                'success': True,
                'profile': None,
                'exists': False,
                'message': 'No freelancer profile found'
            })
    
    elif request.method == 'POST':
        # Create new freelancer profile
        try:
            existing_profile = FreelancerProfile.objects.get(user=user)
            return Response({
                'success': False,
                'message': 'Freelancer profile already exists. Use PUT to update.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except FreelancerProfile.DoesNotExist:
            pass
        
        serializer = FreelancerProfileSerializer(data=request.data)
        if serializer.is_valid():
            freelancer_profile = serializer.save(user=user, user_profile=user_profile)
            return Response({
                'success': True,
                'message': 'Freelancer profile created successfully',
                'profile': FreelancerProfileSerializer(freelancer_profile).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'PUT':
        # Update existing freelancer profile
        try:
            freelancer_profile = FreelancerProfile.objects.get(user=user)
        except FreelancerProfile.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Freelancer profile not found. Create one first.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = FreelancerProfileSerializer(freelancer_profile, data=request.data, partial=True)
        if serializer.is_valid():
            updated_profile = serializer.save()
            return Response({
                'success': True,
                'message': 'Freelancer profile updated successfully',
                'profile': FreelancerProfileSerializer(updated_profile).data
            })
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Delete freelancer profile
        try:
            freelancer_profile = FreelancerProfile.objects.get(user=user)
            freelancer_profile.delete()
            return Response({
                'success': True,
                'message': 'Freelancer profile deleted successfully'
            })
        except FreelancerProfile.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Freelancer profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def client_profile_view(request):
    """Manage client profiles"""
    user = request.user
    user_profile = get_object_or_404(UserProfile, user=user)
    
    if request.method == 'GET':
        try:
            client_profile = ClientProfile.objects.get(user=user)
            serializer = ClientProfileSerializer(client_profile)
            return Response({
                'success': True,
                'profile': serializer.data,
                'exists': True
            })
        except ClientProfile.DoesNotExist:
            return Response({
                'success': True,
                'profile': None,
                'exists': False,
                'message': 'No client profile found'
            })
    
    elif request.method == 'POST':
        # Create new client profile
        try:
            existing_profile = ClientProfile.objects.get(user=user)
            return Response({
                'success': False,
                'message': 'Client profile already exists. Use PUT to update.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except ClientProfile.DoesNotExist:
            pass
        
        serializer = ClientProfileSerializer(data=request.data)
        if serializer.is_valid():
            client_profile = serializer.save(user=user, user_profile=user_profile)
            return Response({
                'success': True,
                'message': 'Client profile created successfully',
                'profile': ClientProfileSerializer(client_profile).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'PUT':
        # Update existing client profile
        try:
            client_profile = ClientProfile.objects.get(user=user)
        except ClientProfile.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Client profile not found. Create one first.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ClientProfileSerializer(client_profile, data=request.data, partial=True)
        if serializer.is_valid():
            updated_profile = serializer.save()
            return Response({
                'success': True,
                'message': 'Client profile updated successfully',
                'profile': ClientProfileSerializer(updated_profile).data
            })
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Delete client profile
        try:
            client_profile = ClientProfile.objects.get(user=user)
            client_profile.delete()
            return Response({
                'success': True,
                'message': 'Client profile deleted successfully'
            })
        except ClientProfile.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Client profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def public_freelancer_profiles(request):
    """Get active freelancer profiles with optional filtering by category/subcategory.
    Query params:
      - category: Category ID
      - subcategory: Subcategory ID
    """
    from django.db.models import Q

    # Only published (is_active) profiles are public
    qs = FreelancerProfile.objects.filter(is_active=True).select_related('user', 'user_profile')

    category_id = request.GET.get('category')
    subcategory_id = request.GET.get('subcategory')

    # Filter by category (match primary, any categories, subcategory's category, or onboarding interested subcategories' category)
    if category_id:
        try:
            cid = int(category_id)
            qs = qs.filter(
                Q(user_profile__primary_category_id=cid)
                | Q(user_profile__categories__id=cid)
                | Q(user_profile__subcategories__category_id=cid)
                | Q(user__onboarding__interested_subcategories__category_id=cid)
            )
        except (ValueError, TypeError):
            pass

    # Filter by subcategory (match profile subcategories or onboarding interested_subcategories)
    if subcategory_id:
        try:
            sid = int(subcategory_id)
            qs = qs.filter(
                Q(user_profile__subcategories__id=sid)
                | Q(user__onboarding__interested_subcategories__id=sid)
            )
        except (ValueError, TypeError):
            pass

    qs = qs.distinct()

    serializer = FreelancerProfileSerializer(qs, many=True)
    return Response({
        'success': True,
        'profiles': serializer.data,
        'count': len(serializer.data)
    })

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_freelancer_publish(request):
    """Publish/unpublish the current user's freelancer profile by toggling is_active.
    Accepts either is_active or is_published (boolean) in body.
    """
    user = request.user
    try:
        fp = FreelancerProfile.objects.get(user=user)
    except FreelancerProfile.DoesNotExist:
        return Response({'success': False, 'message': 'Freelancer profile not found. Create it first.'}, status=status.HTTP_404_NOT_FOUND)

    # Read desired state
    desired = request.data.get('is_active')
    if desired is None:
        desired = request.data.get('is_published')
    # Coerce to bool safely
    if isinstance(desired, str):
        desired = desired.lower() in ['1', 'true', 'yes', 'on']
    elif desired is None:
        # Toggle if not provided
        desired = not fp.is_active

    fp.is_active = bool(desired)
    fp.save(update_fields=['is_active'])

    return Response({
        'success': True,
        'is_active': fp.is_active,
        'message': 'Profile published' if fp.is_active else 'Profile unpublished'
    })
