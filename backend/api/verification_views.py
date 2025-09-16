from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from .verification_models import VerificationRequest, VerificationBadge
from .models import UserVerification
from .verification_serializers import (
    VerificationRequestSerializer, 
    VerificationRequestCreateSerializer,
    VerificationBadgeSerializer,
    AdminVerificationUpdateSerializer
)
from .serializers import UserVerificationSerializer
from .notification_service import NotificationService

class VerificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_verification_request(request):
    """Submit a new verification request"""
    try:
        # Check if user already has a pending or verified request
        existing_request = VerificationRequest.objects.filter(
            user=request.user,
            status__in=['pending', 'verifying', 'verified']
        ).first()
        
        if existing_request:
            if existing_request.status == 'verified':
                return Response({
                    'error': 'You are already verified'
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'error': 'You already have a pending verification request'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = VerificationRequestCreateSerializer(data=request.data)
        if serializer.is_valid():
            verification_request = serializer.save(user=request.user)
            
            # Send notification
            NotificationService.send_verification_notification(
                user=request.user,
                status='submitted'
            )
            
            response_serializer = VerificationRequestSerializer(verification_request)
            return Response({
                'status': 'success',
                'message': 'Verification request submitted successfully',
                'data': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_verification_status(request):
    """Get current user's verification status"""
    try:
        verification_request = VerificationRequest.objects.filter(
            user=request.user
        ).order_by('-created_at').first()
        
        verification_badge = VerificationBadge.objects.filter(
            user=request.user
        ).first()
        
        data = {
            'has_request': verification_request is not None,
            'request': VerificationRequestSerializer(verification_request).data if verification_request else None,
            'badge': VerificationBadgeSerializer(verification_badge).data if verification_badge else None
        }
        
        return Response({
            'status': 'success',
            'data': data
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_verification_requests(request):
    """List all verification requests for admin"""
    try:
        # Check if user is admin (either superuser or specific email)
        if not (request.user.is_superuser or request.user.email == 'kbrian1237@gmail.com'):
            return Response({
                'status': 'error',
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        status_filter = request.GET.get('status', None)
        queryset = VerificationRequest.objects.all()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        paginator = VerificationPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = VerificationRequestSerializer(page, many=True)
            return paginator.get_paginated_response({
                'status': 'success',
                'data': serializer.data
            })
        
        serializer = VerificationRequestSerializer(queryset, many=True)
        return Response({
            'status': 'success',
            'data': serializer.data
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def manage_verification_request(request, request_id):
    """Get or update a specific verification request"""
    try:
        # Check if user is admin (either superuser or specific email)
        if not (request.user.is_superuser or request.user.email == 'kbrian1237@gmail.com'):
            return Response({
                'status': 'error',
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        verification_request = get_object_or_404(VerificationRequest, id=request_id)
        
        if request.method == 'GET':
            serializer = VerificationRequestSerializer(verification_request)
            return Response({
                'status': 'success',
                'data': serializer.data
            })
        
        elif request.method == 'PUT':
            serializer = AdminVerificationUpdateSerializer(
                verification_request, 
                data=request.data, 
                partial=True
            )
            
            if serializer.is_valid():
                with transaction.atomic():
                    # Get old status for notification
                    old_status = VerificationRequest.objects.get(id=verification_request.id).status
                    
                    # Update the verification request
                    verification_request = serializer.save(
                        reviewed_by=request.user,
                        reviewed_at=timezone.now()
                    )
                    
                    # Handle verification badge
                    if verification_request.status == 'verified':
                        badge, created = VerificationBadge.objects.get_or_create(
                            user=verification_request.user,
                            defaults={
                                'is_verified': True,
                                'verified_at': timezone.now(),
                                'verification_level': 'basic'
                            }
                        )
                        if not created:
                            badge.is_verified = True
                            badge.verified_at = timezone.now()
                            badge.save()
                    
                    elif verification_request.status in ['rejected', 'cancelled', 'invalid']:
                        # Remove verification badge if exists
                        VerificationBadge.objects.filter(
                            user=verification_request.user
                        ).update(is_verified=False)
                    
                    # Send notification if status changed
                    if old_status != verification_request.status:
                        if verification_request.status == 'verified':
                            NotificationService.send_verification_notification(
                                user=verification_request.user,
                                status='approved'
                            )
                        elif verification_request.status == 'rejected':
                            NotificationService.send_verification_notification(
                                user=verification_request.user,
                                status='rejected',
                                message=verification_request.admin_notes or ''
                            )
                        elif verification_request.status == 'verifying':
                            NotificationService.send_verification_notification(
                                user=verification_request.user,
                                status='pending_review'
                            )
                
                response_serializer = VerificationRequestSerializer(verification_request)
                return Response({
                    'status': 'success',
                    'message': 'Verification request updated successfully',
                    'data': response_serializer.data
                })
            
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_verification_badge(request, user_id=None):
    """Get verification badge for a specific user or current user"""
    try:
        if user_id:
            from django.contrib.auth.models import User
            user = get_object_or_404(User, id=user_id)
        else:
            user = request.user
        
        badge = VerificationBadge.objects.filter(user=user).first()
        
        return Response({
            'status': 'success',
            'data': {
                'is_verified': badge.is_verified if badge else False,
                'verification_level': badge.verification_level if badge else None,
                'verified_at': badge.verified_at if badge else None
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_verification_overview(request):
    """Get comprehensive verification data from all three tables"""
    try:
        # Check if user is admin (either superuser or specific email)
        if not (request.user.is_superuser or request.user.email == 'kbrian1237@gmail.com'):
            return Response({
                'status': 'error',
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get data from all three verification tables
        verification_requests = VerificationRequest.objects.all().order_by('-created_at')
        verification_badges = VerificationBadge.objects.all().order_by('-verified_at')
        user_verifications = UserVerification.objects.all().order_by('-created_at')
        
        # Serialize the data
        requests_data = VerificationRequestSerializer(verification_requests, many=True).data
        badges_data = VerificationBadgeSerializer(verification_badges, many=True).data
        user_verifications_data = UserVerificationSerializer(user_verifications, many=True).data
        
        return Response({
            'status': 'success',
            'data': {
                'verification_requests': requests_data,
                'verification_badges': badges_data,
                'user_verifications': user_verifications_data,
                'summary': {
                    'total_requests': verification_requests.count(),
                    'total_badges': verification_badges.count(),
                    'total_user_verifications': user_verifications.count(),
                    'verified_users': verification_badges.filter(is_verified=True).count(),
                    'pending_requests': verification_requests.filter(status='pending').count()
                }
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def serve_verification_document(request, request_id, doc_type):
    """Serve verification documents with authentication"""
    try:
        # Check if user is admin
        if not (request.user.is_superuser or request.user.email == 'kbrian1237@gmail.com'):
            return Response({
                'status': 'error',
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        verification_request = get_object_or_404(VerificationRequest, id=request_id)
        
        # Get the appropriate document field
        document_field = None
        if doc_type == 'id_document':
            document_field = verification_request.id_document
        elif doc_type == 'secondary_document':
            document_field = verification_request.secondary_document
        elif doc_type == 'certificates':
            document_field = verification_request.certificates
        
        if not document_field:
            return Response({
                'status': 'error',
                'message': 'Document not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Redirect to the actual file URL
        from django.http import HttpResponseRedirect
        return HttpResponseRedirect(document_field.url)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)