from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, authenticate
from django.db.models import Q, Avg
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied
from decimal import Decimal
from django_filters.rest_framework import DjangoFilterBackend
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import uuid
import secrets
from .models import (
    UserProfile, ProfessionalDocument, Category, Gig, Order, OrderDeliverable, Project, Task, TaskProposal,
    Review, Message, Portfolio, Withdrawal, HelpRequest, Conversation, Team, GroupJoinRequest,
    Job, Proposal, Notification, UserVerification, SavedSearch, OnboardingResponse,
    Course, Lesson, Enrollment, SkillAssessment, AssessmentQuestion, AssessmentAttempt, SkillBadge, CourseReview,
    Dispute, ContentReport, AdminAction, SystemSettings, NotificationPreference, NotificationTemplate, ErrorLog,
    UserAnalytics, PlatformAnalytics, AnalyticsEvent, ThirdPartyIntegration, IntegrationSync, Like,
    AIConversation, AIMessage
)
from .serializers import (
    UserSerializer, UserProfileSerializer, ProfessionalDocumentSerializer, UserRegistrationSerializer, 
    UserLoginSerializer, CategorySerializer, GigSerializer, GigListSerializer,
    OrderSerializer, OrderDeliverableSerializer, ProjectSerializer, ProjectDetailSerializer, TaskSerializer, TaskProposalSerializer,
    ReviewSerializer, MessageSerializer, PortfolioSerializer, WithdrawalSerializer, HelpRequestSerializer, 
    ConversationSerializer, TeamSerializer, GroupJoinRequestSerializer, GroupCreateSerializer,
    JobSerializer, JobListSerializer, ProposalSerializer, ProposalListSerializer,
    NotificationSerializer, UserVerificationSerializer, SavedSearchSerializer, OnboardingResponseSerializer,
    CourseSerializer, CourseListSerializer, LessonSerializer, EnrollmentSerializer,
    SkillAssessmentSerializer, AssessmentQuestionSerializer, AssessmentAttemptSerializer,
    SkillBadgeSerializer, CourseReviewSerializer, DisputeSerializer, ContentReportSerializer,
    AdminActionSerializer, SystemSettingsSerializer, AdminDashboardStatsSerializer,
    NotificationPreferenceSerializer, NotificationTemplateSerializer, NotificationWithPreferencesSerializer,
    ErrorLogSerializer, UserAnalyticsSerializer, PlatformAnalyticsSerializer, AnalyticsEventSerializer,
    ThirdPartyIntegrationSerializer, IntegrationSyncSerializer, AdminUserSerializer,
    AIConversationSerializer, AIMessageSerializer
)
from rest_framework import serializers

def send_verification_email(user, token):
    """Send email verification using an HTML template (consistent with contact emails)."""
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject = 'Verify your Neurolancer account'

    try:
        context = {
            'user_name': user.first_name or user.username,
            'verification_url': verification_url,
        }
        html_content = render_to_string('emails/verify_email.html', context)
        text_content = strip_tags(html_content)

        print(f"Attempting to send email to: {user.email}")
        print(f"SMTP settings: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        print(f"From email: {settings.DEFAULT_FROM_EMAIL}")
        print(f"Verification URL: {verification_url}")

        send_mail(
            subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=html_content,
            fail_silently=False,
        )
        print(f"Email sent successfully to {user.email}")
        print(f"Verification link: {verification_url}")
    except Exception as e:
        print(f"Failed to send verification email to {user.email}: {e}")
        import traceback
        traceback.print_exc()

def send_password_reset_email(user, token):
    """Send password reset email"""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    subject = 'Reset your Neurolancer password'
    message = f'''
Hi {user.first_name or user.username},

You requested to reset your password for your Neurolancer account. Click the link below to reset your password:

{reset_url}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The Neurolancer Team
    '''
    
    try:
        print(f"Attempting to send password reset email to: {user.email}")
        print(f"Reset URL: {reset_url}")
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        print(f"Password reset email sent successfully to {user.email}")
        print(f"Reset link: {reset_url}")
    except Exception as e:
        print(f"Failed to send password reset email to {user.email}: {e}")
        import traceback
        traceback.print_exc()

# Authentication Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate email verification token
        verification_token = secrets.token_urlsafe(32)
        profile = user.userprofile
        profile.email_verified = False
        profile.email_verification_token = verification_token
        profile.email_verification_sent_at = timezone.now()
        profile.save()
        
        # Send verification email
        send_verification_email(user, verification_token)
        
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'profile': UserProfileSerializer(user.userprofile).data,
            'message': 'Registration successful. Please check your email to verify your account.'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    print(f"Login attempt for username: {username}")
    
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        print(f"Login successful for user: {user.username}")
        
        token, created = Token.objects.get_or_create(user=user)
        login(request, user)
        
        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'user_type': 'client', 'bio': ''}
        )
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'profile': UserProfileSerializer(profile).data
        })
    else:
        print(f"Login failed for username: {username}")
        print(f"Serializer errors: {serializer.errors}")
        
        # Additional debugging - try to find the user and check password manually
        try:
            user = User.objects.get(username=username)
            print(f"User {username} exists in database")
            print(f"User is_active: {user.is_active}")
            
            # Test password check
            from django.contrib.auth import authenticate
            auth_result = authenticate(username=username, password=password)
            print(f"Authentication result: {auth_result}")
            
            if not auth_result:
                print(f"Password check failed for user {username}")
                # Check if password is correct using check_password
                password_correct = user.check_password(password)
                print(f"Direct password check result: {password_correct}")
        except User.DoesNotExist:
            print(f"User {username} does not exist")
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_auth(request):
    """Handle Google OAuth authentication"""
    try:
        print(f"Google auth request received: {request.data}")
        
        uid = request.data.get('uid')
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        photo_url = request.data.get('photo_url', '')
        
        print(f"Google auth data: uid={uid}, email={email}, name={first_name} {last_name}")
        
        if not uid or not email:
            print("Google auth error: Missing UID or email")
            return Response({'error': 'UID and email are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists with this email
        try:
            user = User.objects.get(email=email)
            is_new_user = False
        except User.DoesNotExist:
            # Create new user
            username = email.split('@')[0]
            # Ensure unique username
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1
            
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name
            )
            is_new_user = True
        
        # Get or create profile
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'user_type': 'client',
                'bio': '',
                'avatar_type': 'google' if photo_url else 'default',
                'google_photo_url': photo_url or '',
                'selected_avatar': 'user' if not photo_url else '',
                'email_verified': True  # Google accounts are pre-verified
            }
        )
        
        # Ensure profile has valid user_type (fix for superusers and existing accounts)
        if not profile.user_type or profile.user_type not in ['client', 'freelancer', 'both']:
            profile.user_type = 'client'  # Default to client for invalid/empty user_type
            print(f"Fixed invalid user_type for user {user.username}: set to 'client'")
        
        # For new users, set default user_type to client (they can change it later)
        if is_new_user and created:
            profile.user_type = 'client'  # Default to client, user can change later
            profile.email_verified = True  # Google accounts are pre-verified
            if photo_url:
                profile.google_photo_url = photo_url
                profile.avatar_type = 'google'
            else:
                profile.avatar_type = 'avatar'
                profile.selected_avatar = 'user'  # Default neutral avatar
            profile.save()
        else:
            # For existing users, ensure they have email_verified set and update photo if needed
            profile.email_verified = True  # Google accounts are pre-verified
            if photo_url and not profile.google_photo_url:
                profile.google_photo_url = photo_url
                if profile.avatar_type == 'default':
                    profile.avatar_type = 'google'
            # Always save to ensure user_type fix is persisted
            profile.save()
        
        # Create or get token
        token, created = Token.objects.get_or_create(user=user)
        
        print(f"Google auth successful for user {user.username}")
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'profile': UserProfileSerializer(profile).data,
            'is_new_user': is_new_user
        })
        
    except Exception as e:
        print(f"Google auth error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': f'Authentication failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
    except:
        pass
    logout(request)
    return Response({'message': 'Successfully logged out'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile(request):
    try:
        profile = request.user.userprofile
        return Response({
            'user': UserSerializer(request.user).data,
            'profile': UserProfileSerializer(profile).data
        })
    except UserProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_email(request):
    """Verify email address using token"""
    token = request.data.get('token')
    
    if not token:
        return Response({'error': 'Verification token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profile = UserProfile.objects.get(email_verification_token=token)
        
        # Check if token is expired (24 hours)
        if profile.email_verification_sent_at:
            time_diff = timezone.now() - profile.email_verification_sent_at
            if time_diff.total_seconds() > 86400:  # 24 hours
                return Response({'error': 'Verification token has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify email
        profile.email_verified = True
        profile.email_verification_token = None
        profile.email_verification_sent_at = None
        profile.save()
        
        return Response({
            'message': 'Email verified successfully',
            'email_verified': True
        })
        
    except UserProfile.DoesNotExist:
        return Response({'error': 'Invalid verification token'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resend_verification_email(request):
    """Resend email verification"""
    profile = request.user.userprofile
    
    if profile.email_verified:
        return Response({'error': 'Email is already verified'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate new token
    verification_token = secrets.token_urlsafe(32)
    profile.email_verification_token = verification_token
    profile.email_verification_sent_at = timezone.now()
    profile.save()
    
    # Send verification email
    send_verification_email(request.user, verification_token)
    
    return Response({
        'message': 'Verification email sent successfully'
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_email_verification(request):
    """Check if user's email is verified"""
    profile = request.user.userprofile
    return Response({
        'email_verified': profile.email_verified,
        'email': request.user.email
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def check_email_exists(request):
    """Check if email exists in the system"""
    email = request.GET.get('email')
    
    if not email:
        return Response({'error': 'Email parameter is required'}, status=400)
    
    exists = User.objects.filter(email=email).exists()
    return Response({
        'exists': exists,
        'email': email
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password(request):
    """Send password reset email"""
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        # Generate password reset token
        reset_token = secrets.token_urlsafe(32)
        profile = user.userprofile
        profile.password_reset_token = reset_token
        profile.password_reset_sent_at = timezone.now()
        profile.save()
        
        # Send password reset email
        send_password_reset_email(user, reset_token)
        
        return Response({
            'message': 'Password reset email sent successfully. Please check your inbox.',
            'email': email
        })
        
    except User.DoesNotExist:
        # Don't reveal if email exists or not for security
        return Response({
            'message': 'If an account with this email exists, a password reset link has been sent.',
            'email': email
        })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    """Reset password using token"""
    token = request.data.get('token')
    new_password = request.data.get('password')
    
    if not token or not new_password:
        return Response({'error': 'Token and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profile = UserProfile.objects.get(password_reset_token=token)
        
        # Check if token is expired (1 hour)
        if profile.password_reset_sent_at:
            time_diff = timezone.now() - profile.password_reset_sent_at
            if time_diff.total_seconds() > 3600:  # 1 hour
                return Response({'error': 'Password reset token has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password strength
        from django.contrib.auth.password_validation import validate_password
        try:
            validate_password(new_password, profile.user)
        except ValidationError as e:
            return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Reset password
        user = profile.user
        print(f"Password reset for user {user.username}: Setting new password")
        
        # Clear any existing sessions for this user
        from django.contrib.sessions.models import Session
        from django.contrib.auth.models import User as AuthUser
        
        # Set password and force save
        user.set_password(new_password)
        user.save(update_fields=['password'])
        
        # Force refresh from database
        user = AuthUser.objects.get(pk=user.pk)
        print(f"Password reset completed for user {user.username}")
        
        # Test the new password immediately
        from django.contrib.auth import authenticate
        test_auth = authenticate(username=user.username, password=new_password)
        if test_auth:
            print(f"Password reset verification successful for {user.username}")
        else:
            print(f"WARNING: Password reset verification failed for {user.username}")
            # Try direct password check
            direct_check = user.check_password(new_password)
            print(f"Direct password check result: {direct_check}")
        
        # Clear reset token
        profile.password_reset_token = None
        profile.password_reset_sent_at = None
        profile.save()
        
        return Response({
            'message': 'Password reset successfully. You can now login with your new password.',
            'success': True,
            'username': user.username,
            'auth_test': bool(test_auth)
        })
        
    except UserProfile.DoesNotExist:
        return Response({'error': 'Invalid or expired password reset token'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def validate_reset_token(request):
    """Validate password reset token"""
    token = request.data.get('token')
    
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profile = UserProfile.objects.get(password_reset_token=token)
        
        # Check if token is expired (1 hour)
        if profile.password_reset_sent_at:
            time_diff = timezone.now() - profile.password_reset_sent_at
            if time_diff.total_seconds() > 3600:  # 1 hour
                return Response({'error': 'Password reset token has expired', 'valid': False}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'valid': True,
            'email': profile.user.email,
            'message': 'Token is valid'
        })
        
    except UserProfile.DoesNotExist:
        return Response({'error': 'Invalid password reset token', 'valid': False}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def list_users(request):
    """List all users for debugging"""
    users = User.objects.all()[:10]  # Limit to 10 users
    user_data = []
    for user in users:
        user_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat()
        })
    return Response({
        'total_users': User.objects.count(),
        'users': user_data
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def debug_auth(request):
    """Debug authentication issues"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=400)
    
    try:
        user = User.objects.get(username=username)
        
        # Test various authentication methods
        auth_result = authenticate(username=username, password=password)
        direct_check = user.check_password(password)
        
        # Get password hash info
        password_info = {
            'algorithm': user.password.split('$')[0] if '$' in user.password else 'unknown',
            'hash_length': len(user.password),
            'starts_with': user.password[:20] + '...' if len(user.password) > 20 else user.password
        }
        
        return Response({
            'user_exists': True,
            'user_active': user.is_active,
            'authenticate_result': bool(auth_result),
            'direct_check_result': direct_check,
            'password_info': password_info,
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'date_joined': user.date_joined.isoformat()
        })
        
    except User.DoesNotExist:
        return Response({
            'user_exists': False,
            'error': 'User not found'
        })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def test_password_set(request):
    """Test setting a new password for debugging"""
    username = request.data.get('username')
    new_password = request.data.get('new_password')
    
    if not username or not new_password:
        return Response({'error': 'Username and new_password required'}, status=400)
    
    try:
        user = User.objects.get(username=username)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        user.refresh_from_db()
        
        # Test immediately
        auth_test = authenticate(username=username, password=new_password)
        direct_test = user.check_password(new_password)
        
        return Response({
            'password_set': True,
            'immediate_auth_test': bool(auth_test),
            'immediate_direct_test': direct_test,
            'message': 'Password updated and tested'
        })
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

# Category Views
class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        # Public GET, admin-only POST
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        # Lazy import of IsAdminPermission to avoid import order issues
        from .views import IsAdminPermission as _IsAdmin
        return [_IsAdmin()]

class CategoryUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = []

    def get_permissions(self):
        # Admin-only for modify operations
        from .views import IsAdminPermission as _IsAdmin
        return [_IsAdmin()]

# Gig Views
class GigListView(generics.ListAPIView):
    queryset = Gig.objects.filter(is_active=True)
    serializer_class = GigListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'freelancer']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'rating', 'basic_price']
    ordering = ['-freelancer__userprofile__completed_gigs', '-rating', '-created_at']

class GigDetailView(generics.RetrieveAPIView):
    queryset = Gig.objects.filter(is_active=True)
    serializer_class = GigSerializer
    permission_classes = [permissions.AllowAny]

class GigCreateView(generics.CreateAPIView):
    queryset = Gig.objects.all()
    serializer_class = GigSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)

class GigUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Gig.objects.all()
    serializer_class = GigSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Gig.objects.filter(freelancer=self.request.user)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Handle image clearing if requested
        if request.data.get('clear_image') == 'true':
            # Clear the existing image file if we're switching to URL or default
            if instance.image:
                instance.image.delete(save=False)
                instance.image = None
            instance.save()
        
        # If uploading new image, clear the image_url
        if 'image' in request.FILES:
            instance.image_url = ''
            instance.save()
        
        return super().update(request, *args, **kwargs)

class GigDeleteView(generics.DestroyAPIView):
    queryset = Gig.objects.all()
    serializer_class = GigSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Allow staff/superuser (or designated admin email) to delete any gig; otherwise, only own gigs
        if (
            self.request.user.is_staff
            or self.request.user.is_superuser
            or getattr(self.request.user, 'email', '').lower() == 'kbrian1237@gmail.com'
        ):
            return Gig.objects.all()
        return Gig.objects.filter(freelancer=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        # Soft-delete: deactivate gig instead of removing row
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return Response({'message': 'Gig deactivated', 'id': instance.id, 'is_active': instance.is_active})

class MyGigsView(generics.ListAPIView):
    serializer_class = GigSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Gig.objects.filter(freelancer=self.request.user)

# Order Views
class OrderCreateView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Simple order creation - let the serializer handle the logic
        order = serializer.save()
        return order

class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Order.objects.filter(Q(client=user) | Q(freelancer=user)).order_by('-created_at')

class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Order.objects.filter(Q(client=user) | Q(freelancer=user))

class ClientOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(client=self.request.user).order_by('-created_at')

class FreelancerOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Force fresh query from database to avoid caching issues
        queryset = Order.objects.filter(freelancer=self.request.user).order_by('-created_at')
        # Debug logging
        print(f"FreelancerOrdersView: Found {queryset.count()} orders for user {self.request.user.username}")
        for order in queryset:
            print(f"Order {order.id}: {order.title} - Status: {order.status}")
        return queryset

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_order(request, order_id):
    """Freelancer accepts a pending order"""
    try:
        order = Order.objects.get(id=order_id, freelancer=request.user, status='pending')
    except Order.DoesNotExist:
        return Response({'error': 'Order not found or not pending'}, status=404)
    
    # Accept the order
    order.status = 'accepted'
    order.accepted_at = timezone.now()
    order.save()
    
    # If this order is linked to a task, update the task assignment
    if order.task:
        task = order.task
        task.assigned_freelancer = request.user
        task.status = 'assigned'
        task.assigned_at = timezone.now()
        task.save()
        
        # Add freelancer to project group chat if it exists
        if task.project.conversation:
            task.project.conversation.participants.add(request.user)
        
        # Send notification to client about task assignment
        Notification.objects.create(
            user=order.client,
            title=f"Task Assignment Accepted: {task.title}",
            message=f"{request.user.get_full_name() or request.user.username} has accepted the task assignment for '{task.title}' in project '{task.project.title}'",
            notification_type='order',
            action_url=f'/projects/{task.project.id}',
            related_object_id=order.id
        )
    
    # Send general order acceptance notification
    try:
        from .notification_service import NotificationService
        NotificationService.create_notification(
            user=order.client,
            title=f"Order Accepted: {order.title}",
            message=f"{order.freelancer.get_full_name() or order.freelancer.username} has accepted your order and will begin work soon.",
            notification_type='order',
            action_url=f'/orders',
            related_object_id=order.id
        )
    except Exception:
        # Fallback notification
        Notification.objects.create(
            user=order.client,
            title=f"Order Accepted: {order.title}",
            message=f"{order.freelancer.get_full_name() or order.freelancer.username} has accepted your order and will begin work soon.",
            notification_type='order',
            action_url=f'/orders',
            related_object_id=order.id
        )
    
    return Response({
        'message': 'Order accepted successfully',
        'order': OrderSerializer(order).data
    })

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_order_status(request, order_id):
    """Update order status and send notification to client"""
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    
    # Check permissions
    if order.freelancer != request.user and order.client != request.user:
        return Response({'error': 'Permission denied'}, status=403)
    
    new_status = request.data.get('status')
    progress_message = request.data.get('message', '')
    
    if not new_status:
        return Response({'error': 'Status is required'}, status=400)
    
    # Validate status transitions
    valid_transitions = {
        'pending': ['accepted', 'cancelled'] if request.user == order.freelancer else [],
        'accepted': ['in_progress', 'cancelled'] if request.user == order.freelancer else [],
        'in_progress': ['delivered'] if request.user == order.freelancer else ['cancelled'],
        'delivered': ['completed', 'revision_requested'] if request.user == order.client else [],
        'revision_requested': ['in_progress'] if request.user == order.freelancer else [],
        'completed': [],
        'cancelled': [],
        'disputed': []
    }
    
    if new_status not in valid_transitions.get(order.status, []):
        return Response({'error': 'Invalid status transition'}, status=400)
    
    # Update order
    old_status = order.status
    order.status = new_status
    
    if progress_message:
        order.progress_notes = (order.progress_notes or '') + f"\n[{timezone.now().strftime('%Y-%m-%d %H:%M')}] {progress_message}"
    
    # Set timestamps
    if new_status == 'accepted':
        order.accepted_at = timezone.now()
    elif new_status == 'delivered':
        order.delivered_at = timezone.now()
    elif new_status == 'completed':
        order.completed_at = timezone.now()
        # Release escrow payment
        if order.is_paid and not order.escrow_released:
            order.escrow_released = True
            freelancer_profile = order.freelancer.userprofile
            
            # Import currency conversion function
            from .payments import convert_kes_to_usd
            
            # Convert KES payment to USD for balance storage
            payment_amount_kes = order.price  # Order price is in KES
            payment_amount_usd = convert_kes_to_usd(payment_amount_kes)
            
            # Move from escrow to available balance if in escrow, otherwise add directly
            if freelancer_profile.escrow_balance >= payment_amount_usd:
                freelancer_profile.escrow_balance -= payment_amount_usd
                freelancer_profile.available_balance += payment_amount_usd
            else:
                # If not in escrow, add directly to available balance
                freelancer_profile.available_balance += payment_amount_usd
            
            freelancer_profile.total_earnings += payment_amount_usd
            
            # Update completed gigs count
            freelancer_profile.completed_gigs = Order.objects.filter(
                freelancer=order.freelancer, 
                status='completed'
            ).count()
            freelancer_profile.save()
            
            print(f"Order {order.id} completed: Added {payment_amount_kes} KES (${payment_amount_usd:.2f} USD) to freelancer {order.freelancer.username} balance")
            
            # Send payment notification to freelancer (display in USD)
            Notification.objects.create(
                user=order.freelancer,
                title=f'Payment Received: ${payment_amount_usd:.2f}',
                message=f'You have received payment of ${payment_amount_usd:.2f} for "{order.title}". The amount has been added to your available balance.',
                notification_type='payment',
                action_url='/dashboard',
                related_object_id=order.id
            )
    
    order.save()
    
    # Force database refresh to ensure changes are committed
    order.refresh_from_db()
    print(f"Order {order.id} status updated from {old_status} to {order.status} (requested: {new_status})")
    
    # Send notifications
    send_order_status_notification(order, old_status, new_status, progress_message, request.user)
    
    # Update task status if linked to a task
    if order.task:
        task = order.task
        if new_status == 'accepted':
            task.status = 'assigned'
            task.assigned_freelancer = order.freelancer
            task.assigned_at = timezone.now()
        elif new_status == 'in_progress':
            task.status = 'in_progress'
        elif new_status == 'delivered':
            task.status = 'review'
        elif new_status == 'completed':
            task.status = 'completed'
            task.completed_at = timezone.now()
        task.save()
    
    # Update project status if needed
    if order.project:
        update_project_status(order.project)
    
    return Response({
        'message': 'Order status updated successfully',
        'order': OrderSerializer(order).data,
        'notification_sent': True
    })

def send_order_status_notification(order, old_status, new_status, message, updated_by):
    """Send status update notifications to relevant parties"""
    status_messages = {
        'accepted': 'Your order has been accepted and work will begin soon',
        'in_progress': 'Work has started on your order',
        'delivered': 'Your order has been delivered and is ready for review',
        'revision_requested': 'Revision has been requested for your delivery',
        'completed': 'Your order has been completed successfully',
        'cancelled': 'Your order has been cancelled',
    }
    
    # Determine recipient
    recipient = order.client if updated_by == order.freelancer else order.freelancer
    updater_name = f"{updated_by.first_name} {updated_by.last_name}".strip() or updated_by.username
    
    notification_title = f"Order Update: {order.title}"
    notification_message = f"{updater_name} updated '{order.title}': {status_messages.get(new_status, f'Status changed to {new_status}')}"
    
    if message:
        notification_message += f"\n\nMessage: {message}"
    
    Notification.objects.create(
        user=recipient,
        title=notification_title,
        message=notification_message,
        notification_type='order',
        action_url=f'/orders',
        related_object_id=order.id
    )
    
    # Also notify project group if exists
    if order.project and order.project.conversation:
        Message.objects.create(
            conversation=order.project.conversation,
            sender=updated_by,
            content=f"📋 Order Update: {order.title} - {status_messages.get(new_status, new_status)}\n{message if message else ''}"
        )

def update_project_status(project):
    """Update project status based on task completion"""
    tasks = project.tasks.all()
    if not tasks.exists():
        return
    
    # Check if all tasks are completed
    incomplete_tasks = tasks.exclude(status='completed')
    
    if incomplete_tasks.exists():
        # If there are incomplete tasks, project cannot be completed
        if project.status == 'completed':
            project.status = 'active'
    else:
        # All tasks are completed, project can be completed
        project.status = 'completed'
    
    project.save()

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_order_update(request, order_id):
    """Client requests update from freelancer"""
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    
    # Check if user is the client for this order
    if order.client != request.user:
        return Response({'error': 'Only the client can request updates'}, status=403)
    
    update_message = request.data.get('message', '')
    
    if not update_message:
        return Response({'error': 'Update message is required'}, status=400)
    
    # Create notification for freelancer
    client_name = f"{order.client.first_name} {order.client.last_name}".strip() or order.client.username
    
    Notification.objects.create(
        user=order.freelancer,
        title=f"Update Requested: {order.title}",
        message=f"{client_name} requested an update on '{order.title}': {update_message}",
        notification_type='order',
        action_url=f'/orders',
        related_object_id=order.id
    )
    
    return Response({
        'message': 'Update request sent to freelancer',
        'notification_sent': True
    })

# Order Deliverable Views
class OrderDeliverableCreateView(generics.CreateAPIView):
    queryset = OrderDeliverable.objects.all()
    serializer_class = OrderDeliverableSerializer
    permission_classes = [permissions.IsAuthenticated]

class OrderDeliverableListView(generics.ListAPIView):
    serializer_class = OrderDeliverableSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        order_id = self.kwargs.get('order_id')
        user = self.request.user
        return OrderDeliverable.objects.filter(
            order_id=order_id,
            order__client=user
        ).union(
            OrderDeliverable.objects.filter(
                order_id=order_id,
                order__freelancer=user
            )
        )

# Review Views
class ReviewCreateView(generics.CreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        order = serializer.validated_data['order']
        user = self.request.user
        
        # Ensure user is part of the order and order is completed
        if not (order.client == user or order.freelancer == user):
            raise ValidationError("You can only review orders you participated in")
        if order.status != 'completed':
            raise ValidationError("You can only review completed orders")
        
        # Check if review already exists for this order
        if Review.objects.filter(order=order).exists():
            raise ValidationError("Review already exists for this order")
            
        serializer.save(reviewer=user)

class ReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        gig_id = self.kwargs.get('gig_id')
        if gig_id:
            return Review.objects.filter(gig_id=gig_id).order_by('-created_at')
        return Review.objects.all().order_by('-created_at')

# Message Views
class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user).order_by('-updated_at')

class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Allow access to group conversations for invitation purposes
        conversation_id = self.kwargs.get('pk')
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            if conversation.conversation_type == 'group':
                # Allow access to group info for invitations
                return Conversation.objects.filter(id=conversation_id)
            else:
                # For direct messages, require participation
                return Conversation.objects.filter(id=conversation_id, participants=self.request.user)
        except Conversation.DoesNotExist:
            return Conversation.objects.none()

class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        conversation = Conversation.objects.filter(id=conversation_id, participants=self.request.user).first()
        if conversation:
            # Mark messages as read
            conversation.messages.filter(is_read=False).exclude(sender=self.request.user).update(is_read=True)
            # Force fresh query from database with proper ordering and no caching
            return Message.objects.filter(conversation=conversation).select_related('sender', 'sender__userprofile').order_by('created_at')
        return Message.objects.none()
    
    def list(self, request, *args, **kwargs):
        conversation_id = self.kwargs.get('conversation_id')
        print(f"Loading messages for conversation {conversation_id} by user {request.user.username}")
        
        # Force fresh database query with no caching
        conversation = Conversation.objects.filter(id=conversation_id, participants=request.user).first()
        if not conversation:
            print(f"  No access to conversation {conversation_id}")
            return Response([])
        
        # Get messages directly from database with fresh query
        messages = Message.objects.filter(conversation=conversation).select_related('sender', 'sender__userprofile').order_by('created_at')
        print(f"Found {messages.count()} messages in conversation {conversation_id}")
        
        # Log the latest messages for debugging
        latest_messages = messages.order_by('-created_at')[:5]
        for msg in latest_messages:
            print(f"  Message {msg.id}: {msg.content[:50]}... (from {msg.sender.username} at {msg.created_at})")
        
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

class MessageCreateView(generics.CreateAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        conversation = serializer.validated_data['conversation']
        user = self.request.user
        
        # Check for AI sender override
        sender_override = self.request.data.get('sender_override')
        if sender_override == 'ai':
            # Create or get AI user
            ai_user, created = User.objects.get_or_create(
                username='neurolancer_ai',
                defaults={
                    'first_name': 'Neurolancer',
                    'last_name': 'AI',
                    'email': 'ai@neurolancer.com',
                    'is_active': True
                }
            )
            
            # Create AI user profile if needed
            if created:
                UserProfile.objects.create(
                    user=ai_user,
                    user_type='both',
                    bio='I am Neurolancer AI, your intelligent assistant for the platform.',
                    avatar_type='default',
                    selected_avatar='ai'
                )
            
            # Ensure AI is participant in conversation
            if ai_user not in conversation.participants.all():
                conversation.participants.add(ai_user)
            
            message = serializer.save(sender=ai_user)
        else:
            # Ensure user is participant in conversation
            if user not in conversation.participants.all():
                raise ValidationError("You can only send messages in conversations you participate in")
                
            message = serializer.save(sender=user)
        
        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save()
        
        # Force refresh message from database to ensure it's properly saved
        message.refresh_from_db()
        print(f"Message created: ID={message.id}, Content='{message.content[:50]}...', Sender={message.sender.username}, Conversation={conversation.id}, Created_at={message.created_at}")
        
        # Force database commit by doing another query
        Message.objects.filter(id=message.id).update(created_at=message.created_at)
        
        # Broadcast message via WebSocket
        self.broadcast_message(message)
    
    def broadcast_message(self, message):
        """Broadcast new message to WebSocket consumers"""
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            if channel_layer:
                # Force refresh message from database before serializing
                message.refresh_from_db()
                
                # Serialize message data
                message_data = MessageSerializer(message).data
                print(f"Broadcasting message {message.id} to conversation {message.conversation.id} at {message.created_at}")
                
                # Send to conversation group
                conversation_group = f"conversation_{message.conversation.id}"
                async_to_sync(channel_layer.group_send)(
                    conversation_group,
                    {
                        'type': 'new_message',
                        'message': message_data,
                        'conversation_id': message.conversation.id
                    }
                )
                
                # Send to individual user groups for notifications
                for participant in message.conversation.participants.exclude(id=message.sender.id):
                    user_group = f"user_{participant.id}"
                    async_to_sync(channel_layer.group_send)(
                        user_group,
                        {
                            'type': 'new_message',
                            'message': message_data
                        }
                    )
                print(f"Message broadcast completed for conversation {message.conversation.id}")
        except Exception as e:
            # Don't fail message creation if WebSocket fails
            print(f"WebSocket broadcast failed: {e}")
            import traceback
            traceback.print_exc()

class MessageUpdateView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Message.objects.filter(sender=self.request.user)

# Team Views
class TeamListView(generics.ListCreateAPIView):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Team.objects.filter(members=self.request.user)

class TeamDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Team.objects.filter(members=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_team(request, team_id):
    try:
        team = Team.objects.get(id=team_id)
        team.members.add(request.user)
        return Response({'message': 'Joined team successfully'})
    except Team.DoesNotExist:
        return Response({'error': 'Team not found'}, status=404)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_group_chat(request):
    serializer = GroupCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        conversation = serializer.save()
        
        # Broadcast conversation update
        broadcast_conversation_update(conversation)
        
        return Response(ConversationSerializer(conversation, context={'request': request}).data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_messages_read(request, conversation_id):
    """Mark all messages in a conversation as read"""
    try:
        conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        conversation.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        return Response({'message': 'Messages marked as read'})
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=404)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_conversation(request):
    other_user_id = request.data.get('user_id')
    order_id = request.data.get('order_id')
    
    try:
        other_user = User.objects.get(id=other_user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    # Check if conversation already exists
    existing = Conversation.objects.filter(
        participants=request.user,
        conversation_type='direct'
    ).filter(participants=other_user).first()
    
    if existing:
        return Response(ConversationSerializer(existing, context={'request': request}).data)
    
    # Create new conversation
    conversation = Conversation.objects.create(conversation_type='direct')
    conversation.participants.add(request.user, other_user)
    
    if order_id:
        try:
            order = Order.objects.get(id=order_id)
            conversation.order = order
            conversation.save()
        except Order.DoesNotExist:
            pass
    
    # Broadcast conversation update
    broadcast_conversation_update(conversation)
    
    return Response(ConversationSerializer(conversation, context={'request': request}).data, status=201)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_direct_conversation(request):
    """Start a direct conversation with another user"""
    other_user_id = request.data.get('user_id') or request.data.get('participant_id')
    
    if not other_user_id:
        return Response({'error': 'User ID is required'}, status=400)
    
    try:
        other_user = User.objects.get(id=other_user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if other_user == request.user:
        return Response({'error': 'Cannot start conversation with yourself'}, status=400)
    
    # Check if conversation already exists
    existing = Conversation.objects.filter(
        participants=request.user,
        conversation_type='direct'
    ).filter(participants=other_user).first()
    
    if existing:
        return Response({
            'id': existing.id,
            'conversation': ConversationSerializer(existing, context={'request': request}).data,
            'created': False
        })
    
    # Create new conversation
    conversation = Conversation.objects.create(
        conversation_type='direct',
        name=f"{request.user.get_full_name() or request.user.username} & {other_user.get_full_name() or other_user.username}"
    )
    conversation.participants.add(request.user, other_user)
    
    # Broadcast conversation update
    broadcast_conversation_update(conversation)
    
    return Response({
        'id': conversation.id,
        'conversation': ConversationSerializer(conversation, context={'request': request}).data,
        'created': True
    }, status=201)

def broadcast_conversation_update(conversation):
    """Broadcast conversation update to participants"""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            conversation_data = ConversationSerializer(conversation).data
            
            # Send to all participants
            for participant in conversation.participants.all():
                user_group = f"user_{participant.id}"
                async_to_sync(channel_layer.group_send)(
                    user_group,
                    {
                        'type': 'conversation_update',
                        'conversation': conversation_data
                    }
                )
    except Exception as e:
        print(f"Conversation update broadcast failed: {e}")

# Portfolio Views
class PortfolioCreateView(generics.CreateAPIView):
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.IsAuthenticated]

class PortfolioListView(generics.ListAPIView):
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        freelancer_id = self.kwargs.get('freelancer_id')
        if freelancer_id:
            return Portfolio.objects.filter(freelancer_id=freelancer_id).order_by('-created_at')
        return Portfolio.objects.all().order_by('-created_at')

class MyPortfolioView(generics.ListAPIView):
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Portfolio.objects.filter(freelancer=self.request.user).order_by('-created_at')

class PortfolioUpdateView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Portfolio.objects.filter(freelancer=self.request.user)

# Withdrawal Views
class WithdrawalCreateView(generics.CreateAPIView):
    queryset = Withdrawal.objects.all()
    serializer_class = WithdrawalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class WithdrawalListView(generics.ListAPIView):
    serializer_class = WithdrawalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Withdrawal.objects.filter(user=self.request.user).order_by('-created_at')

# Help Request Views
class HelpRequestCreateView(generics.CreateAPIView):
    queryset = HelpRequest.objects.all()
    serializer_class = HelpRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

class HelpRequestListView(generics.ListAPIView):
    serializer_class = HelpRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return HelpRequest.objects.filter(status='open').order_by('-created_at')

class MyHelpRequestsView(generics.ListAPIView):
    serializer_class = HelpRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return HelpRequest.objects.filter(requester=self.request.user).order_by('-created_at')

class HelpRequestDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = HelpRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return HelpRequest.objects.filter(Q(requester=user) | Q(helper=user))

# Freelancer Views
class FreelancerListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'bio']
    ordering_fields = ['rating', 'total_reviews', 'user__date_joined']
    ordering = ['-completed_gigs', '-rating', '-total_reviews']
    
    def get_queryset(self):
        return UserProfile.objects.filter(user_type__in=['freelancer', 'both'])

# User Profile Views
class UserProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                'avatar_type': 'avatar',
                'selected_avatar': 'user'
            }
        )
        return profile
    
    def update(self, request, *args, **kwargs):
        profile = self.get_object()
        user = request.user
        
        # Update user fields if provided
        user_fields = ['first_name', 'last_name', 'email']
        for field in user_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        
        # Update profile fields
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return updated profile with user data
        return Response({
            **serializer.data,
            'user': UserSerializer(user).data
        })

class FreelancerProfileView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_object(self):
        user_id = self.kwargs.get('user_id')
        try:
            return UserProfile.objects.get(user_id=user_id)
        except UserProfile.DoesNotExist:
            from django.http import Http404
            raise Http404("Freelancer profile not found")

# Dashboard Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    from django.db.models import Sum, Count, Q
    from datetime import datetime, timedelta
    import calendar
    
    user = request.user
    profile = user.userprofile
    
    if profile.user_type in ['freelancer', 'both']:
        # Freelancer stats - use correct data from UserProfile and actual counts
        total_gigs = Gig.objects.filter(freelancer=user).count()
        active_orders = Order.objects.filter(freelancer=user, status__in=['accepted', 'in_progress', 'delivered']).count()
        pending_orders = Order.objects.filter(freelancer=user, status='pending').count()
        
        # Get actual completed orders count and earnings from database
        completed_orders_qs = Order.objects.filter(freelancer=user, status='completed')
        completed_orders = completed_orders_qs.count()
        
        # Calculate total earnings from completed orders
        from django.db.models import Sum
        actual_earnings = completed_orders_qs.aggregate(total=Sum('price'))['total'] or 0
        
        # Always use calculated earnings, not cached profile values
        total_earnings = float(actual_earnings)
        available_balance = float(profile.available_balance)
        
        # Update profile with correct data if needed
        if profile.completed_gigs != completed_orders or abs(float(profile.total_earnings) - total_earnings) > 0.01:
            profile.completed_gigs = completed_orders
            profile.total_earnings = total_earnings
            profile.save()
            print(f"Updated profile for {user.username}: completed_gigs={completed_orders}, total_earnings=${total_earnings}")
        
        print(f"Dashboard stats for {user.username}: completed_orders={completed_orders}, actual_earnings=${actual_earnings}")
        
        # Monthly earnings data
        monthly_earnings = []
        monthly_orders = []
        for i in range(6):
            month_start = datetime.now().replace(day=1) - timedelta(days=30*i)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            earnings = Order.objects.filter(
                freelancer=user,
                status='completed',
                completed_at__range=[month_start, month_end]
            ).aggregate(total=Sum('price'))['total'] or 0
            
            orders_count = Order.objects.filter(
                freelancer=user,
                created_at__range=[month_start, month_end]
            ).count()
            
            monthly_earnings.insert(0, float(earnings))
            monthly_orders.insert(0, orders_count)
        
        return Response({
            'user_type': 'freelancer',
            'total_gigs': total_gigs,
            'active_orders': active_orders,
            'pending_orders': pending_orders,
            'completed_orders': completed_orders,
            'total_earnings': total_earnings,
            'available_balance': available_balance,
            'monthly_earnings': monthly_earnings,
            'monthly_orders': monthly_orders,
            'debug_info': {
                'calculated_earnings': float(actual_earnings),
                'profile_earnings': float(profile.total_earnings),
                'orders_found': completed_orders
            }
        })
    else:
        # Client stats
        total_orders = Order.objects.filter(client=user).count()
        active_orders = Order.objects.filter(client=user, status__in=['accepted', 'in_progress', 'delivered']).count()
        pending_orders = Order.objects.filter(client=user, status='pending').count()
        completed_orders = Order.objects.filter(client=user, status='completed').count()
        total_spent = Order.objects.filter(client=user, status='completed').aggregate(total=Sum('price'))['total'] or 0
        
        # Monthly spending data
        monthly_spending = []
        monthly_orders = []
        for i in range(6):
            month_start = datetime.now().replace(day=1) - timedelta(days=30*i)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            spending = Order.objects.filter(
                client=user,
                status='completed',
                completed_at__range=[month_start, month_end]
            ).aggregate(total=Sum('price'))['total'] or 0
            
            orders_count = Order.objects.filter(
                client=user,
                created_at__range=[month_start, month_end]
            ).count()
            
            monthly_spending.insert(0, float(spending))
            monthly_orders.insert(0, orders_count)
        
        return Response({
            'user_type': 'client',
            'total_orders': total_orders,
            'active_orders': active_orders,
            'pending_orders': pending_orders,
            'completed_orders': completed_orders,
            'total_spent': float(total_spent),
            'monthly_spending': monthly_spending,
            'monthly_orders': monthly_orders
        })

# Project Views
class ProjectListView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Return projects where user is client or has accepted orders for tasks
        return Project.objects.filter(
            Q(client=user) | 
            Q(orders__freelancer=user, orders__status__in=['accepted', 'in_progress', 'delivered', 'completed'])
        ).distinct().order_by('-created_at')

class ProjectCreateView(generics.CreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

class ProjectDetailView(generics.RetrieveAPIView):
    serializer_class = ProjectDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Allow access if user is client or has accepted orders for tasks in the project
        return Project.objects.filter(
            Q(client=user) | 
            Q(orders__freelancer=user, orders__status__in=['accepted', 'in_progress', 'delivered', 'completed'])
        ).distinct()

class ProjectUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Project.objects.filter(client=self.request.user)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')
        
        # Validate project completion
        if new_status == 'completed':
            incomplete_tasks = instance.tasks.exclude(status='completed')
            if incomplete_tasks.exists():
                return Response({
                    'error': 'Cannot mark project as completed. The following tasks are not completed:',
                    'incomplete_tasks': [{
                        'id': task.id,
                        'title': task.title,
                        'status': task.status
                    } for task in incomplete_tasks]
                }, status=400)
        
        return super().update(request, *args, **kwargs)

# Project Update View
class ProjectUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Project.objects.filter(client=self.request.user)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')
        
        # Validate project completion
        if new_status == 'completed':
            incomplete_tasks = instance.tasks.exclude(status='completed')
            if incomplete_tasks.exists():
                return Response({
                    'error': 'Cannot mark project as completed. The following tasks are not completed:',
                    'incomplete_tasks': [{
                        'id': task.id,
                        'title': task.title,
                        'status': task.status
                    } for task in incomplete_tasks]
                }, status=400)
        
        return super().update(request, *args, **kwargs)

# Task Views
class TaskCreateView(generics.CreateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        project_id = serializer.validated_data.pop('project_id')
        try:
            project = Project.objects.get(id=project_id, client=self.request.user)
            serializer.save(project=project)
        except Project.DoesNotExist:
            raise ValidationError("Project not found or you don't have permission to create tasks for this project")

class TaskUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Task.objects.filter(
            Q(project__client=self.request.user) | 
            Q(assigned_freelancer=self.request.user)
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_task_proposal(request):
    task_id = request.data.get('task_id')
    freelancer_id = request.data.get('freelancer_id')
    message = request.data.get('message', '')
    proposed_budget = request.data.get('proposed_budget')
    
    try:
        task = Task.objects.get(id=task_id)
        freelancer = User.objects.get(id=freelancer_id)
    except (Task.DoesNotExist, User.DoesNotExist):
        return Response({'error': 'Task or freelancer not found'}, status=404)
    
    if task.project.client != request.user:
        return Response({'error': 'Permission denied'}, status=403)
    
    # Create task proposal
    proposal, created = TaskProposal.objects.get_or_create(
        task=task,
        freelancer=freelancer,
        defaults={
            'message': message,
            'proposed_budget': proposed_budget or task.budget
        }
    )
    
    if not created:
        return Response({'error': 'Proposal already exists'}, status=400)
    
    # Send notification to freelancer
    Notification.objects.create(
        user=freelancer,
        title=f'New Task Proposal: {task.title}',
        message=f'You have received a task proposal for "{task.title}" from {request.user.first_name} {request.user.last_name}',
        notification_type='proposal',
        related_object_id=task.id
    )
    
    return Response({'message': 'Proposal sent successfully'})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def respond_task_proposal(request, proposal_id):
    try:
        proposal = TaskProposal.objects.get(id=proposal_id, freelancer=request.user)
    except TaskProposal.DoesNotExist:
        return Response({'error': 'Proposal not found'}, status=404)
    
    action = request.data.get('action')  # 'accept' or 'reject'
    
    if action == 'accept':
        proposal.status = 'accepted'
        proposal.responded_at = timezone.now()
        proposal.save()
        
        # Assign task to freelancer
        task = proposal.task
        task.assigned_freelancer = request.user
        task.status = 'assigned'
        task.assigned_at = timezone.now()
        task.save()
        
        # Add freelancer to project group chat
        if task.project.conversation:
            task.project.conversation.participants.add(request.user)
        
        # Notify client
        Notification.objects.create(
            user=task.project.client,
            title=f'Task Proposal Accepted: {task.title}',
            message=f'{request.user.first_name} {request.user.last_name} accepted the task proposal for "{task.title}"',
            notification_type='proposal',
            related_object_id=task.id
        )
        
        return Response({'message': 'Proposal accepted successfully'})
    
    elif action == 'reject':
        proposal.status = 'rejected'
        proposal.responded_at = timezone.now()
        proposal.save()
        
        # Notify client
        Notification.objects.create(
            user=task.project.client,
            title=f'Task Proposal Rejected: {proposal.task.title}',
            message=f'{request.user.first_name} {request.user.last_name} rejected the task proposal for "{proposal.task.title}"',
            notification_type='proposal',
            related_object_id=proposal.task.id
        )
        
        return Response({'message': 'Proposal rejected'})
    
    return Response({'error': 'Invalid action'}, status=400)

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_task_progress(request, task_id):
    try:
        task = Task.objects.get(id=task_id, assigned_freelancer=request.user)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=404)
    
    progress = request.data.get('progress')
    status_update = request.data.get('status')
    
    if progress is not None:
        task.progress = min(100, max(0, int(progress)))
    
    if status_update:
        task.status = status_update
        if status_update == 'completed':
            task.completed_at = timezone.now()
            task.progress = 100
            
            # Send completion notification
            Notification.objects.create(
                user=task.project.client,
                title=f'Task Completed: {task.title}',
                message=f'{request.user.first_name} {request.user.last_name} has completed the task "{task.title}"',
                notification_type='order',
                related_object_id=task.id
            )
            
            # Send payment request notification
            Notification.objects.create(
                user=task.project.client,
                title=f'Payment Required: {task.title}',
                message=f'Payment of ${task.budget} is required for the completed task "{task.title}"',
                notification_type='payment',
                related_object_id=task.id
            )
    
    task.save()
    
    # Update project status based on task completion
    update_project_status(task.project)
    
    return Response({
        'message': 'Task updated successfully',
        'progress': task.progress,
        'status': task.status
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_task_assignment(request):
    """Create a task assignment and send notification to freelancer"""
    task_id = request.data.get('task_id')
    freelancer_id = request.data.get('freelancer_id')
    gig_id = request.data.get('gig_id')
    message = request.data.get('message', '')
    
    try:
        task = Task.objects.get(id=task_id)
        freelancer = User.objects.get(id=freelancer_id)
        gig = Gig.objects.get(id=gig_id) if gig_id else None
    except (Task.DoesNotExist, User.DoesNotExist, Gig.DoesNotExist):
        return Response({'error': 'Task, freelancer, or gig not found'}, status=404)
    
    # Check if user owns the project
    if task.project.client != request.user:
        return Response({'error': 'Permission denied'}, status=403)
    
    # Check if task is already assigned
    if task.assigned_freelancer:
        return Response({'error': 'Task is already assigned'}, status=400)
    
    # Check if there's already a pending order for this task
    existing_order = Order.objects.filter(task=task, status='pending').first()
    if existing_order:
        return Response({'error': 'Task assignment already pending'}, status=400)
    
    # Create an order for the task assignment that freelancer can accept/decline
    order = Order.objects.create(
        client=request.user,
        freelancer=freelancer,
        gig=gig,
        title=f'Task Assignment: {task.title}',
        description=f'Task from project "{task.project.title}": {task.description}\n\nClient message: {message}',
        price=task.budget,
        package_type='custom',
        delivery_time=7,  # Default 7 days
        status='pending',
        project=task.project,
        task=task
    )
    
    # Update task status to show it has a pending assignment
    task.status = 'pending'
    task.save()
    
    # Create task assignment notification
    Notification.objects.create(
        user=freelancer,
        title=f'New Task Assignment: {task.title}',
        message=f'You have been assigned to work on "{task.title}" in project "{task.project.title}". Please check your orders to accept or decline. {message}',
        notification_type='order',
        action_url=f'/orders',
        related_object_id=order.id
    )
    
    return Response({
        'message': 'Task assignment created successfully',
        'task_id': task.id,
        'freelancer_id': freelancer.id,
        'order_id': order.id
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_task_assignment(request, task_id):
    """Freelancer accepts a task assignment"""
    try:
        task = Task.objects.get(id=task_id)
        # Find the related order for this task
        order = Order.objects.get(task=task, freelancer=request.user, status='pending')
    except (Task.DoesNotExist, Order.DoesNotExist):
        return Response({'error': 'Task assignment not found'}, status=404)
    
    # Check if task is available for assignment
    if task.assigned_freelancer:
        return Response({'error': 'Task is already assigned'}, status=400)
    
    # Accept the order
    order.status = 'accepted'
    order.accepted_at = timezone.now()
    order.save()
    
    # Assign task to freelancer
    task.assigned_freelancer = request.user
    task.status = 'assigned'
    task.assigned_at = timezone.now()
    task.save()
    
    # Add freelancer to project group chat if it exists
    if task.project.conversation:
        task.project.conversation.participants.add(request.user)
        
        # Send welcome message to group
        Message.objects.create(
            conversation=task.project.conversation,
            sender=request.user,
            content=f"👋 Hi everyone! I've joined the project to work on: {task.title}"
        )
    else:
        # Create project group chat if it doesn't exist
        conversation = Conversation.objects.create(
            name=f"{task.project.title} - Team Chat",
            conversation_type='group',
            group_type='private'
        )
        conversation.participants.add(task.project.client, request.user)
        task.project.conversation = conversation
        task.project.save()
        
        # Send initial message
        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=f"👋 Project team chat created! I'm working on: {task.title}"
        )
    
    # Notify client of acceptance
    Notification.objects.create(
        user=task.project.client,
        title=f'Task Assignment Accepted: {task.title}',
        message=f'{request.user.first_name} {request.user.last_name} has accepted the task assignment for "{task.title}"',
        notification_type='order',
        action_url=f'/projects/{task.project.id}',
        related_object_id=order.id
    )
    
    return Response({
        'message': 'Task assignment accepted successfully',
        'task': TaskSerializer(task).data,
        'order': OrderSerializer(order).data,
        'conversation_id': task.project.conversation.id if task.project.conversation else None
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def decline_task_assignment(request, task_id):
    """Freelancer declines a task assignment"""
    try:
        task = Task.objects.get(id=task_id)
        # Find the related order for this task
        order = Order.objects.get(task=task, freelancer=request.user, status='pending')
    except (Task.DoesNotExist, Order.DoesNotExist):
        return Response({'error': 'Task assignment not found'}, status=404)
    
    decline_reason = request.data.get('reason', 'No reason provided')
    
    # Update order status to cancelled
    order.status = 'cancelled'
    order.save()
    
    # Notify client of decline
    Notification.objects.create(
        user=task.project.client,
        title=f'Task Assignment Declined: {task.title}',
        message=f'{request.user.first_name} {request.user.last_name} declined the task assignment for "{task.title}". Reason: {decline_reason}',
        notification_type='order',
        action_url=f'/projects/{task.project.id}',
        related_object_id=order.id
    )
    
    return Response({
        'message': 'Task assignment declined',
        'task_id': task.id,
        'order_id': order.id
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_team(request, project_id):
    """Get project team members"""
    try:
        project = Project.objects.get(id=project_id, client=request.user)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)
    
    # Get team members from assigned tasks
    team_members = User.objects.filter(assigned_tasks__project=project).distinct()
    
    team_data = []
    for member in team_members:
        profile = member.userprofile
        team_data.append({
            'id': member.id,
            'first_name': member.first_name,
            'last_name': member.last_name,
            'username': member.username,
            'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
            'rating': float(profile.rating),
            'total_reviews': profile.total_reviews,
            'hourly_rate': float(profile.hourly_rate) if profile.hourly_rate else 0,
            'skills': profile.skills.split(',') if profile.skills else []
        })
    
    return Response(team_data)

# User Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def all_users(request):
    query = request.GET.get('q', '')
    users = UserProfile.objects.exclude(user=request.user).select_related('user')
    
    if query:
        users = users.filter(
            Q(user__first_name__icontains=query) |
            Q(user__last_name__icontains=query) |
            Q(user__username__icontains=query) |
            Q(user__email__icontains=query) |
            Q(bio__icontains=query)
        )
    
    serializer = UserProfileSerializer(users, many=True)
    return Response(serializer.data)

# Group Management Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def discover_groups(request):
    """List groups that user can discover and join"""
    groups = Conversation.objects.filter(
        conversation_type='group',
        is_discoverable=True
    ).exclude(participants=request.user)
    
    # Filter out project groups that user can't join
    accessible_groups = []
    for group in groups:
        if group.group_type == 'project':
            if group.can_join(request.user):
                accessible_groups.append(group.id)
        else:
            accessible_groups.append(group.id)
    
    groups = groups.filter(id__in=accessible_groups)
    
    query = request.GET.get('q', '')
    if query:
        groups = groups.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )
    
    serializer = ConversationSerializer(groups, many=True, context={'request': request})
    return Response(serializer.data)



@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_group(request, group_id):
    """Join a group (public) or request to join (private/project)"""
    try:
        group = Conversation.objects.get(id=group_id, conversation_type='group')
    except Conversation.DoesNotExist:
        return Response({'error': 'Group not found'}, status=404)
    
    if request.user in group.participants.all():
        return Response({'error': 'Already in the group'}, status=400)
    
    if group.participants.count() >= group.max_members:
        return Response({'error': 'Group is full'}, status=400)
    
    password = request.data.get('password', '')
    
    if group.group_type == 'public':
        group.participants.add(request.user)
        return Response({'message': 'Joined group successfully'})
    elif group.group_type == 'private':
        if group.can_join(request.user, password):
            group.participants.add(request.user)
            return Response({'message': 'Joined private group successfully'})
        else:
            return Response({'error': 'Invalid password'}, status=400)
    elif group.group_type == 'project':
        if group.can_join(request.user):
            group.participants.add(request.user)
            return Response({'message': 'Joined project group successfully'})
        else:
            return Response({'error': 'You must be part of the project to join this group'}, status=403)
    
    return Response({'error': 'Cannot join group'}, status=400)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def leave_group(request, group_id):
    """Leave a group"""
    try:
        group = Conversation.objects.get(id=group_id, conversation_type='group')
    except Conversation.DoesNotExist:
        return Response({'error': 'Group not found'}, status=404)
    
    if request.user not in group.participants.all():
        return Response({'error': 'Not a member'}, status=400)
    
    if group.is_admin(request.user) and group.participants.count() > 1:
        return Response({'error': 'Admin cannot leave group with members. Transfer admin first.'}, status=400)
    
    group.participants.remove(request.user)
    
    # Delete group if no members left
    if group.participants.count() == 0:
        group.delete()
        return Response({'message': 'Group deleted as last member left'})
    
    return Response({'message': 'Left group successfully'})

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_group(request, group_id):
    """Update group settings (admin only)"""
    try:
        group = Conversation.objects.get(id=group_id, conversation_type='group')
    except Conversation.DoesNotExist:
        return Response({'error': 'Group not found'}, status=404)
    
    if not group.is_admin(request.user):
        return Response({'error': 'Only admin can update group'}, status=403)
    
    serializer = GroupCreateSerializer(group, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(ConversationSerializer(group, context={'request': request}).data)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def transfer_admin(request, group_id):
    """Transfer admin rights to another member"""
    try:
        group = Conversation.objects.get(id=group_id, conversation_type='group')
    except Conversation.DoesNotExist:
        return Response({'error': 'Group not found'}, status=404)
    
    if not group.is_admin(request.user):
        return Response({'error': 'Only admin can transfer admin rights'}, status=403)
    
    new_admin_id = request.data.get('user_id')
    try:
        new_admin = User.objects.get(id=new_admin_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if new_admin not in group.participants.all():
        return Response({'error': 'User is not a member of this group'}, status=400)
    
    group.admin = new_admin
    group.save()
    
    return Response({'message': f'Admin rights transferred to {new_admin.first_name} {new_admin.last_name}'})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_member(request, group_id):
    """Remove a member from group (admin only)"""
    try:
        group = Conversation.objects.get(id=group_id, conversation_type='group')
    except Conversation.DoesNotExist:
        return Response({'error': 'Group not found'}, status=404)
    
    if not group.is_admin(request.user):
        return Response({'error': 'Only admin can remove members'}, status=403)
    
    user_id = request.data.get('user_id')
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if user == request.user:
        return Response({'error': 'Cannot remove yourself'}, status=400)
    
    if user not in group.participants.all():
        return Response({'error': 'User is not a member'}, status=400)
    
    group.participants.remove(user)
    return Response({'message': f'{user.first_name} {user.last_name} removed from group'})

# Search Views
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_gigs(request):
    query = request.GET.get('q', '')
    category_id = request.GET.get('category', '')
    min_price = request.GET.get('min_price', '')
    max_price = request.GET.get('max_price', '')
    
    gigs = Gig.objects.filter(is_active=True)
    
    if query:
        gigs = gigs.filter(
            Q(title__icontains=query) | 
            Q(description__icontains=query) | 
            Q(tags__icontains=query)
        )
    
    if category_id:
        try:
            category_id = int(category_id)
            gigs = gigs.filter(category_id=category_id)
        except (ValueError, TypeError):
            pass
    
    if min_price:
        gigs = gigs.filter(basic_price__gte=min_price)
    
    if max_price:
        gigs = gigs.filter(basic_price__lte=max_price)
    
    gigs = gigs.order_by('-rating', '-created_at')
    
    serializer = GigListSerializer(gigs, many=True)
    return Response(serializer.data)

# Jobs/Projects Marketplace Views
class JobListView(generics.ListAPIView):
    queryset = Job.objects.filter(status='open')
    serializer_class = JobListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'experience_level', 'job_type']
    search_fields = ['title', 'description', 'skills_required']
    ordering_fields = ['created_at', 'budget_min', 'deadline', 'proposal_count']
    ordering = ['-created_at']

class JobDetailView(generics.RetrieveAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        # Allow public access to open jobs, and owner access to their own jobs
        if self.request.user.is_authenticated:
            return Job.objects.filter(
                Q(status='open') | Q(client=self.request.user)
            )
        return Job.objects.filter(status='open')

class JobCreateView(generics.CreateAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        job = serializer.save(client=self.request.user)
        
        # Notify relevant freelancers
        skills = job.skills_required.lower().split(',')
        freelancers = UserProfile.objects.filter(
            user_type__in=['freelancer', 'both']
        ).filter(
            Q(skills__icontains=skills[0].strip()) if skills else Q()
        )[:5]  # Limit to 5 notifications
        
        for freelancer in freelancers:
            Notification.objects.create(
                user=freelancer.user,
                title=f"New Job: {job.title}",
                message=f"A new job matching your skills has been posted in {job.category.name}",
                notification_type='job',
                action_url=f'/jobs/{job.id}',
                related_object_id=job.id
            )

class MyJobsView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Return jobs posted by client OR jobs where freelancer has accepted proposals
        return Job.objects.filter(
            Q(client=user) | 
            Q(proposals__freelancer=user, proposals__status='accepted')
        ).distinct().order_by('-created_at')

class JobUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Job.objects.filter(client=self.request.user)

class JobDeleteView(generics.DestroyAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Job.objects.filter(client=self.request.user)

# Proposal Views
class ProposalCreateView(generics.CreateAPIView):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProposalListView(generics.ListAPIView):
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        if job_id:
            try:
                job = Job.objects.get(id=job_id)
                if job.client == self.request.user:
                    return job.proposals.all().order_by('-created_at')
            except Job.DoesNotExist:
                from django.http import Http404
                raise Http404("Job not found")
        return Proposal.objects.none()

class MyProposalsView(generics.ListAPIView):
    serializer_class = ProposalListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Proposal.objects.filter(freelancer=self.request.user).order_by('-created_at')

class ProposalUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Proposal.objects.filter(freelancer=self.request.user)
    
    def update(self, request, *args, **kwargs):
        try:
            # Remove job_id from update data if present (not needed for updates)
            if 'job_id' in request.data:
                request.data.pop('job_id')
            return super().update(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_proposal(request, proposal_id):
    """Accept a proposal for a job and create order"""
    try:
        proposal = Proposal.objects.get(id=proposal_id)
    except Proposal.DoesNotExist:
        return Response({'error': 'Proposal not found'}, status=404)
    
    if proposal.job.client != request.user:
        return Response({'error': 'Only job owner can accept proposals'}, status=403)
    
    if proposal.status != 'pending':
        return Response({
            'error': f'Cannot accept proposal. Current status: {proposal.status}. Only pending proposals can be accepted.'
        }, status=400)
    
    # Check if job is still open
    if proposal.job.status != 'open':
        return Response({
            'error': f'Cannot accept proposal. Job status is {proposal.job.status}. Only open jobs can have proposals accepted.'
        }, status=400)
    
    # Accept the proposal
    proposal.status = 'accepted'
    proposal.save()
    
    # Update job status
    job = proposal.job
    job.status = 'in_progress'
    job.save()
    
    # Reject other proposals
    other_proposals = job.proposals.exclude(id=proposal_id).filter(status='pending')
    other_proposals.update(status='rejected')
    
    # Create order for tracking
    order = Order.objects.create(
        client=job.client,
        freelancer=proposal.freelancer,
        title=f"Job: {job.title}",
        description=job.description,
        price=proposal.proposed_price,
        delivery_time=proposal.delivery_time,
        status='accepted',
        package_type='custom'
    )
    
    # Send notifications
    try:
        Notification.objects.create(
            user=proposal.freelancer,
            title=f"Proposal Accepted: {job.title}",
            message=f"Your proposal has been accepted! Order #{order.id} created. You can now start working.",
            notification_type='proposal',
            action_url=f'/orders/{order.id}',
            related_object_id=order.id
        )
        
        # Notify rejected freelancers
        for rejected_proposal in other_proposals:
            Notification.objects.create(
                user=rejected_proposal.freelancer,
                title=f"Proposal Update: {job.title}",
                message=f"Thank you for your proposal. The client has selected another freelancer for this project.",
                notification_type='proposal',
                related_object_id=rejected_proposal.id
            )
    except Exception as e:
        # Don't fail the acceptance if notifications fail
        print(f"Notification creation failed: {e}")
    
    return Response({
        'message': 'Proposal accepted successfully',
        'order_id': order.id,
        'proposal_status': proposal.status,
        'job_status': job.status
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_proposal(request, proposal_id):
    """Reject a proposal for a job"""
    try:
        proposal = Proposal.objects.get(id=proposal_id)
    except Proposal.DoesNotExist:
        return Response({'error': 'Proposal not found'}, status=404)
    
    if proposal.job.client != request.user:
        return Response({'error': 'Only job owner can reject proposals'}, status=403)
    
    if proposal.status != 'pending':
        return Response({
            'error': f'Cannot reject proposal. Current status: {proposal.status}. Only pending proposals can be rejected.'
        }, status=400)
    
    proposal.status = 'rejected'
    proposal.save()
    
    # Send notification
    try:
        Notification.objects.create(
            user=proposal.freelancer,
            title=f"Proposal Update: {proposal.job.title}",
            message=f"Thank you for your proposal. The client has decided to go with another freelancer.",
            notification_type='proposal',
            action_url=f'/my-proposals',
            related_object_id=proposal.id
        )
    except Exception as e:
        print(f"Notification creation failed: {e}")
    
    return Response({
        'message': 'Proposal rejected',
        'proposal_status': proposal.status
    })

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_job_status(request, job_id):
    """Update job status and send notification"""
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=404)
    
    # Check permissions - allow job owner or assigned freelancer
    is_job_owner = job.client == request.user
    is_assigned_freelancer = job.proposals.filter(status='accepted', freelancer=request.user).exists()
    
    if not is_job_owner and not is_assigned_freelancer:
        return Response({'error': 'Permission denied'}, status=403)
    
    new_status = request.data.get('status')
    progress_message = request.data.get('message', '')
    
    if not new_status:
        return Response({'error': 'Status is required'}, status=400)
    
    # Update job status
    old_status = job.status
    job.status = new_status
    job.save()
    
    # Update related orders
    accepted_freelancers = job.proposals.filter(status='accepted').values_list('freelancer', flat=True)
    orders = Order.objects.filter(
        Q(client=job.client) | Q(freelancer__in=accepted_freelancers)
    ).filter(title__icontains=job.title)
    
    print(f"Job {job.id} status update to {new_status}:")
    print(f"  - Accepted freelancers: {list(accepted_freelancers)}")
    print(f"  - Found {orders.count()} related orders")
    for order in orders:
        print(f"  - Order {order.id}: {order.title} (current status: {order.status})")
    
    if new_status == 'completed':
        updated_count = orders.update(status='completed', completed_at=timezone.now())
        print(f"  - Updated {updated_count} orders to completed")
    elif new_status == 'cancelled':
        updated_count = orders.update(status='cancelled')
        print(f"  - Updated {updated_count} orders to cancelled")
    
    # Send notifications to relevant parties
    if job.client == request.user:
        # Client updated status - notify freelancer
        accepted_proposal = job.proposals.filter(status='accepted').first()
        if accepted_proposal:
            Notification.objects.create(
                user=accepted_proposal.freelancer,
                title=f"Job Update: {job.title}",
                message=f"Client updated job status to {new_status.replace('_', ' ')}. {progress_message}",
                notification_type='job',
                action_url=f'/jobs/{job.id}',
                related_object_id=job.id
            )
    else:
        # Freelancer updated status - notify client
        Notification.objects.create(
            user=job.client,
            title=f"Job Update: {job.title}",
            message=f"Freelancer updated job status to {new_status.replace('_', ' ')}. {progress_message}",
            notification_type='job',
            action_url=f'/jobs/{job.id}',
            related_object_id=job.id
        )
    
    return Response({
        'success': True,
        'message': f'Job status updated to {new_status}',
        'debug': {
            'job_id': job.id,
            'old_status': old_status,
            'new_status': new_status,
            'orders_found': orders.count(),
            'accepted_freelancers': list(accepted_freelancers)
        }
    })

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_payment(request):
    """Freelancer requests payment from client"""
    order_id = request.data.get('order_id')
    note = request.data.get('note', '')
    
    try:
        order = Order.objects.get(id=order_id, freelancer=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    
    if order.status not in ['delivered', 'completed']:
        return Response({'error': 'Can only request payment for delivered work'}, status=400)
    
    # Update order status to request payment
    order.status = 'delivered'
    order.delivered_at = timezone.now()
    order.save()
    
    # Create notification for client
    Notification.objects.create(
        user=order.client,
        title=f"Payment Request: {order.title}",
        message=f"Work completed! Payment of ${order.price} requested. {note}",
        notification_type='payment',
        action_url=f'/orders/{order.id}',
        related_object_id=order.id
    )
    
    return Response({'message': 'Payment request sent successfully'})

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def process_job_payment(request, job_id):
    """Process payment for completed job"""
    try:
        job = Job.objects.get(id=job_id, client=request.user)
        print(f"Found job {job.id}: {job.title} (status: {job.status})")
    except Job.DoesNotExist:
        print(f"Job {job_id} not found for user {request.user.username}")
        return Response({'error': 'Job not found'}, status=404)
    
    # Allow payment for both completed and delivered jobs
    if job.status not in ['completed', 'delivered']:
        print(f"Job {job.id} status is {job.status}, not completed or delivered")
        return Response({'error': f'Job must be completed or delivered to process payment. Current status: {job.status}'}, status=400)
    
    # Find accepted proposal
    accepted_proposal = job.proposals.filter(status='accepted').first()
    if not accepted_proposal:
        print(f"No accepted proposal found for job {job.id}")
        proposals = job.proposals.all()
        print(f"Available proposals: {[(p.id, p.status, p.freelancer.username) for p in proposals]}")
        return Response({'error': 'No accepted proposal found'}, status=400)
    
    print(f"Found accepted proposal {accepted_proposal.id} by {accepted_proposal.freelancer.username}")
    
    # Find related order - try multiple approaches
    order = None
    
    # First try: exact title match
    order = Order.objects.filter(
        client=job.client,
        freelancer=accepted_proposal.freelancer,
        title=f"Job: {job.title}"
    ).first()
    
    # Second try: contains job title
    if not order:
        order = Order.objects.filter(
            client=job.client,
            freelancer=accepted_proposal.freelancer,
            title__icontains=job.title
        ).first()
    
    # Third try: any order between client and freelancer
    if not order:
        order = Order.objects.filter(
            client=job.client,
            freelancer=accepted_proposal.freelancer
        ).order_by('-created_at').first()
    
    if not order:
        print(f"No order found for job {job.id}")
        # Try to find any order for this freelancer and client
        all_orders = Order.objects.filter(
            client=job.client,
            freelancer=accepted_proposal.freelancer
        )
        print(f"All orders between client and freelancer: {[(o.id, o.title, o.status) for o in all_orders]}")
        return Response({'error': 'No order found for this job'}, status=400)
    
    print(f"Found order {order.id}: {order.title} (status: {order.status}, is_paid: {getattr(order, 'is_paid', False)})")
    
    if getattr(order, 'is_paid', False):
        return Response({'error': 'Payment already processed'}, status=400)
    
    # Create payment reference
    payment_reference = f"job_{job.id}_order_{order.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
    
    # Process payment (simulate success for now)
    order.is_paid = True
    order.payment_reference = payment_reference
    order.status = 'completed'
    order.completed_at = timezone.now()
    order.escrow_released = True
    order.save()
    
    # Update freelancer earnings
    freelancer_profile = order.freelancer.userprofile
    
    # Import currency conversion function
    from .payments import convert_kes_to_usd
    
    # Convert KES payment to USD for balance storage
    payment_amount_kes = order.price  # Order price is in KES
    payment_amount_usd = convert_kes_to_usd(payment_amount_kes)
    
    freelancer_profile.available_balance += payment_amount_usd
    freelancer_profile.total_earnings += payment_amount_usd
    freelancer_profile.completed_gigs += 1
    freelancer_profile.save()
    
    print(f"Job payment processed: Added {payment_amount_kes} KES (${payment_amount_usd:.2f} USD) to freelancer {order.freelancer.username} balance")
    
    # Update job status
    job.status = 'completed'
    job.save()
    
    # Send notifications (display in USD)
    Notification.objects.create(
        user=order.freelancer,
        title=f'Payment Received: ${payment_amount_usd:.2f}',
        message=f'Payment for "{job.title}" has been processed. Amount added to your balance.',
        notification_type='payment',
        action_url='/dashboard',
        related_object_id=order.id
    )
    
    Notification.objects.create(
        user=order.client,
        title=f'Payment Processed: {job.title}',
        message=f'Payment of ${order.price} has been successfully processed.',
        notification_type='payment',
        action_url=f'/orders/{order.id}',
        related_object_id=order.id
    )
    
    return Response({
        'message': 'Payment processed successfully',
        'order_id': order.id,
        'amount': float(order.price),
        'reference': payment_reference
    })

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_job_payment(request, job_id):
    """Freelancer requests payment for completed job"""
    try:
        job = Job.objects.get(id=job_id)
        accepted_proposal = job.proposals.filter(status='accepted', freelancer=request.user).first()
        if not accepted_proposal:
            return Response({'error': 'No accepted proposal found'}, status=404)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=404)
    
    if job.status != 'completed':
        return Response({'error': 'Job must be completed to request payment'}, status=400)
    
    # Send payment request notification to client
    Notification.objects.create(
        user=job.client,
        title=f"Payment Request: {job.title}",
        message=f"{request.user.get_full_name() or request.user.username} has requested payment of ${accepted_proposal.proposed_price} for the completed job '{job.title}'. Please process the payment.",
        notification_type='payment',
        action_url=f'/my-jobs',
        related_object_id=job.id
    )
    
    return Response({
        'message': 'Payment request sent to client successfully',
        'job_id': job.id,
        'amount': float(accepted_proposal.proposed_price)
    })

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_job_work(request, job_id):
    """Freelancer marks job work as completed"""
    try:
        job = Job.objects.get(id=job_id)
        accepted_proposal = job.proposals.filter(status='accepted', freelancer=request.user).first()
        if not accepted_proposal:
            return Response({'error': 'No accepted proposal found'}, status=404)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=404)
    
    deliverable_notes = request.data.get('notes', '')
    
    # Find related order
    order = Order.objects.filter(
        client=job.client,
        freelancer=request.user,
        title__icontains=job.title
    ).first()
    
    if order:
        order.status = 'delivered'
        order.delivered_at = timezone.now()
        order.progress_notes = (order.progress_notes or '') + f"\n[{timezone.now().strftime('%Y-%m-%d %H:%M')}] Work completed: {deliverable_notes}"
        order.save()
    
    # Update job status
    job.status = 'delivered'
    job.save()
    
    # Notify client
    Notification.objects.create(
        user=job.client,
        title=f"Work Delivered: {job.title}",
        message=f"Your job has been completed and delivered. Please review and process payment. Notes: {deliverable_notes}",
        notification_type='job',
        action_url=f'/jobs/{job.id}',
        related_object_id=job.id
    )
    
    return Response({
        'message': 'Work marked as completed',
        'job_id': job.id,
        'order_id': order.id if order else None
    })

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def process_order_payment(request, order_id):
    """Process payment for completed order"""
    try:
        order = Order.objects.get(id=order_id, client=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    
    if order.status != 'completed':
        return Response({'error': 'Order must be completed to process payment'}, status=400)
    
    if order.is_paid:
        return Response({'error': 'Payment already processed'}, status=400)
    
    # Create payment reference
    payment_reference = f"order_{order.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
    
    # Process payment (simulate success for now)
    order.is_paid = True
    order.payment_reference = payment_reference
    order.escrow_released = True
    order.save()
    
    # Update freelancer earnings
    freelancer_profile = order.freelancer.userprofile
    
    # Import currency conversion function
    from .payments import convert_kes_to_usd
    
    # Convert KES payment to USD for balance storage
    payment_amount_kes = order.price  # Order price is in KES
    payment_amount_usd = convert_kes_to_usd(payment_amount_kes)
    
    freelancer_profile.available_balance += payment_amount_usd
    freelancer_profile.total_earnings += payment_amount_usd
    freelancer_profile.completed_gigs += 1
    freelancer_profile.save()
    
    print(f"Order payment processed: Added {payment_amount_kes} KES (${payment_amount_usd:.2f} USD) to freelancer {order.freelancer.username} balance")
    
    # Send notifications (display in USD)
    Notification.objects.create(
        user=order.freelancer,
        title=f'Payment Received: ${payment_amount_usd:.2f}',
        message=f'Payment for "{order.title}" has been processed. Amount added to your balance.',
        notification_type='payment',
        action_url='/dashboard',
        related_object_id=order.id
    )
    
    Notification.objects.create(
        user=order.client,
        title=f'Payment Processed: {order.title}',
        message=f'Payment of ${order.price} has been successfully processed.',
        notification_type='payment',
        action_url=f'/orders/{order.id}',
        related_object_id=order.id
    )
    
    return Response({
        'message': 'Payment processed successfully',
        'order_id': order.id,
        'amount': float(order.price),
        'reference': payment_reference
    })

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_order_payment(request, order_id):
    """Freelancer requests payment for completed order"""
    try:
        order = Order.objects.get(id=order_id, freelancer=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    
    if order.status != 'completed':
        return Response({'error': 'Order must be completed to request payment'}, status=400)
    
    # Send payment request notification to client
    Notification.objects.create(
        user=order.client,
        title=f"Payment Request: {order.title}",
        message=f"{request.user.get_full_name() or request.user.username} has requested payment of ${order.price} for the completed order '{order.title}'. Please process the payment.",
        notification_type='payment',
        action_url=f'/orders',
        related_object_id=order.id
    )
    
    return Response({
        'message': 'Payment request sent to client successfully',
        'order_id': order.id,
        'amount': float(order.price)
    })

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_proposal_status(request, proposal_id):
    """Update proposal status (for freelancer to withdraw)"""
    try:
        proposal = Proposal.objects.get(id=proposal_id, freelancer=request.user)
    except Proposal.DoesNotExist:
        return Response({'error': 'Proposal not found'}, status=404)
    
    new_status = request.data.get('status')
    if new_status not in ['withdrawn']:
        return Response({'error': 'Invalid status'}, status=400)
    
    if proposal.status != 'pending':
        return Response({
            'error': f'Can only withdraw pending proposals. Current status: {proposal.status}'
        }, status=400)
    
    proposal.status = new_status
    proposal.save()
    
    # Update job proposal count
    job = proposal.job
    job.proposal_count = max(0, job.proposal_count - 1)
    job.save()
    
    return Response({
        'message': 'Proposal withdrawn successfully',
        'proposal_status': proposal.status
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def job_proposal_details(request, job_id, proposal_id):
    """Get detailed proposal information for job owner"""
    try:
        job = Job.objects.get(id=job_id, client=request.user)
        proposal = job.proposals.get(id=proposal_id)
    except (Job.DoesNotExist, Proposal.DoesNotExist):
        return Response({'error': 'Job or proposal not found'}, status=404)
    
    serializer = ProposalSerializer(proposal, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def debug_proposal_status(request, proposal_id):
    """Debug endpoint to check proposal status"""
    try:
        proposal = Proposal.objects.get(id=proposal_id)
        
        # Check if user has permission to view this proposal
        if proposal.job.client != request.user and proposal.freelancer != request.user:
            return Response({'error': 'Permission denied'}, status=403)
        
        return Response({
            'proposal_id': proposal.id,
            'status': proposal.status,
            'job_id': proposal.job.id,
            'job_status': proposal.job.status,
            'job_title': proposal.job.title,
            'freelancer': proposal.freelancer.username,
            'client': proposal.job.client.username,
            'created_at': proposal.created_at,
            'can_accept': proposal.status == 'pending' and proposal.job.status == 'open',
            'can_reject': proposal.status == 'pending'
        })
    except Proposal.DoesNotExist:
        return Response({'error': 'Proposal not found'}, status=404)

# Debug Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def debug_job_proposals(request, job_id):
    """Debug endpoint to check all proposals for a job"""
    try:
        job = Job.objects.get(id=job_id)
        
        # Check if user has permission to view this job
        if job.client != request.user:
            return Response({'error': 'Permission denied'}, status=403)
        
        proposals = job.proposals.all()
        proposal_data = []
        
        for proposal in proposals:
            proposal_data.append({
                'id': proposal.id,
                'status': proposal.status,
                'freelancer': proposal.freelancer.username,
                'proposed_price': float(proposal.proposed_price),
                'created_at': proposal.created_at,
                'can_accept': proposal.status == 'pending' and job.status == 'open',
                'can_reject': proposal.status == 'pending'
            })
        
        return Response({
            'job_id': job.id,
            'job_title': job.title,
            'job_status': job.status,
            'total_proposals': proposals.count(),
            'proposals': proposal_data
        })
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=404)

# Notification Views
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationCreateView(generics.CreateAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        print(f"NotificationCreateView: Received data: {request.data}")
        print(f"NotificationCreateView: Request method: {request.method}")
        print(f"NotificationCreateView: Content type: {request.content_type}")
        print(f"NotificationCreateView: User: {request.user}")
        print(f"NotificationCreateView: Is authenticated: {request.user.is_authenticated}")
        
        # Debug the action_url field specifically
        action_url = request.data.get('action_url')
        print(f"NotificationCreateView: action_url type: {type(action_url)}")
        print(f"NotificationCreateView: action_url value: {action_url}")
        
        # Fix action_url if it's an array
        if isinstance(action_url, list) and len(action_url) > 0:
            print(f"NotificationCreateView: Converting action_url from array to string")
            request.data['action_url'] = action_url[0]
        
        try:
            result = super().create(request, *args, **kwargs)
            print(f"NotificationCreateView: Success - {result.status_code}")
            return result
        except Exception as e:
            print(f"NotificationCreateView: Exception - {e}")
            print(f"NotificationCreateView: Exception type - {type(e)}")
            if hasattr(e, 'detail'):
                print(f"NotificationCreateView: Exception detail - {e.detail}")
            raise
    
    def perform_create(self, serializer):
        # Allow creating notifications for other users (for payment requests, etc.)
        user_id = self.request.data.get('user_id')
        print(f"NotificationCreateView: user_id = {user_id}")
        if user_id:
            try:
                target_user = User.objects.get(id=user_id)
                print(f"NotificationCreateView: Found target user: {target_user.username}")
                serializer.save(user=target_user)
            except User.DoesNotExist:
                print(f"NotificationCreateView: User {user_id} not found")
                raise ValidationError({'user_id': 'User not found'})
        else:
            print(f"NotificationCreateView: Using request user: {self.request.user.username}")
            serializer.save(user=self.request.user)

class UnreadNotificationCountView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'message': f'{updated} notifications marked as read'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def debug_notifications(request):
    """Debug endpoint to check notifications for current user"""
    user_id = request.GET.get('user_id')
    if user_id:
        try:
            target_user = User.objects.get(id=user_id)
            notifications = Notification.objects.filter(user=target_user).order_by('-created_at')[:10]
            return Response({
                'target_user': target_user.username,
                'notifications_count': notifications.count(),
                'notifications': [{
                    'id': n.id,
                    'title': n.title,
                    'message': n.message,
                    'notification_type': n.notification_type,
                    'is_read': n.is_read,
                    'created_at': n.created_at.isoformat()
                } for n in notifications]
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
    else:
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')[:10]
        return Response({
            'current_user': request.user.username,
            'notifications_count': notifications.count(),
            'notifications': [{
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'notification_type': n.notification_type,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat()
            } for n in notifications]
        })

# Enhanced Search Views
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_jobs(request):
    """Advanced job search with filtering"""
    query = request.GET.get('q', '')
    category_id = request.GET.get('category', '')
    min_budget = request.GET.get('min_budget', '')
    max_budget = request.GET.get('max_budget', '')
    experience_level = request.GET.get('experience_level', '')
    job_type = request.GET.get('job_type', '')
    location = request.GET.get('location', '')
    
    jobs = Job.objects.filter(status='open')
    
    if query:
        jobs = jobs.filter(
            Q(title__icontains=query) | 
            Q(description__icontains=query) | 
            Q(skills_required__icontains=query)
        )
    
    if category_id:
        try:
            category_id = int(category_id)
            jobs = jobs.filter(category_id=category_id)
        except (ValueError, TypeError):
            pass
    
    if min_budget:
        jobs = jobs.filter(budget_min__gte=min_budget)
    
    if max_budget:
        jobs = jobs.filter(budget_max__lte=max_budget)
    
    if experience_level:
        jobs = jobs.filter(experience_level=experience_level)
    
    if job_type:
        jobs = jobs.filter(job_type=job_type)
    
    if location:
        jobs = jobs.filter(location__icontains=location)
    
    jobs = jobs.order_by('-created_at')
    
    serializer = JobListSerializer(jobs, many=True)
    return Response(serializer.data)

# Saved Search Views
class SavedSearchListView(generics.ListAPIView):
    serializer_class = SavedSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedSearch.objects.filter(user=self.request.user).order_by('-created_at')

class SavedSearchCreateView(generics.CreateAPIView):
    queryset = SavedSearch.objects.all()
    serializer_class = SavedSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SavedSearchDeleteView(generics.DestroyAPIView):
    serializer_class = SavedSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedSearch.objects.filter(user=self.request.user)

# Onboarding Views
class OnboardingResponseCreateView(generics.CreateAPIView):
    queryset = OnboardingResponse.objects.all()
    serializer_class = OnboardingResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class OnboardingResponseUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = OnboardingResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj, created = OnboardingResponse.objects.get_or_create(user=self.request.user)
        return obj

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_onboarding_status(request):
    """Check if user has completed onboarding"""
    try:
        onboarding = OnboardingResponse.objects.get(user=request.user)
        return Response({
            'completed': onboarding.is_completed,
            'data': OnboardingResponseSerializer(onboarding).data
        })
    except OnboardingResponse.DoesNotExist:
        return Response({
            'completed': False,
            'data': None
        })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_onboarding_data(request):
    """Get user's onboarding data"""
    try:
        onboarding = OnboardingResponse.objects.get(user=request.user)
        return Response(OnboardingResponseSerializer(onboarding).data)
    except OnboardingResponse.DoesNotExist:
        return Response({'error': 'No onboarding data found'}, status=404)

# Learning & Development Views
class CourseListView(generics.ListCreateAPIView):
    queryset = Course.objects.filter(status='published')
    serializer_class = CourseListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'difficulty_level', 'instructor']
    search_fields = ['title', 'description', 'learning_outcomes']
    ordering_fields = ['created_at', 'rating', 'enrollment_count', 'price']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CourseSerializer
        return CourseListSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.filter(status='published')
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]

class CourseUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Course.objects.filter(instructor=self.request.user)

class CourseCreateView(generics.CreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

class CourseCreateView(generics.CreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

class LessonCreateView(generics.CreateAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if course.instructor != self.request.user:
            raise PermissionDenied("You can only add lessons to your own courses")
        serializer.save()

class LessonUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Lesson.objects.filter(course__instructor=self.request.user)

class LessonDeleteView(generics.DestroyAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Lesson.objects.filter(course__instructor=self.request.user)

class LessonUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Lesson.objects.filter(course__instructor=self.request.user)

class LessonDeleteView(generics.DestroyAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Lesson.objects.filter(course__instructor=self.request.user)

class CourseEnrollView(generics.CreateAPIView):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        course_id = kwargs.get('course_id')
        
            # Check if already enrolled
        if Enrollment.objects.filter(student=request.user, course_id=course_id).exists():
            return Response({'error': 'Already enrolled in this course'}, status=400)
        
        # Create enrollment
        course = Course.objects.get(id=course_id)
        enrollment = Enrollment.objects.create(
            student=request.user,
            course=course,
            payment_reference=request.data.get('payment_reference', '')
        )
        
        # Update course enrollment count
        course.enrollment_count += 1
        course.save()
        
        return Response(EnrollmentSerializer(enrollment).data, status=201)

class MyCoursesView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Force fresh query from database
        enrollments = Enrollment.objects.filter(student=self.request.user).select_for_update()
        course_ids = list(enrollments.values_list('course_id', flat=True))
        return Course.objects.filter(id__in=course_ids)
    
    def list(self, request, *args, **kwargs):
        # Get fresh course data
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        courses_data = serializer.data
        
        # Force completely fresh enrollment data with no caching
        enrollments = Enrollment.objects.filter(student=request.user).select_related('course').prefetch_related('completed_lessons')
        enrollment_dict = {}
        
        print(f"MyCoursesView: Processing enrollments for user {request.user.username}")
        
        for enrollment in enrollments:
            # Force refresh from database
            enrollment.refresh_from_db()
            
            # Recalculate progress to ensure accuracy
            total_lessons = enrollment.course.lessons.count()
            completed_count = enrollment.completed_lessons.count()
            calculated_progress = (completed_count / total_lessons) * 100 if total_lessons > 0 else 0
            
            # Update progress if it doesn't match calculated value
            if abs(float(enrollment.progress_percentage or 0) - calculated_progress) > 0.01:
                print(f"  Correcting progress for course {enrollment.course.id}: {enrollment.progress_percentage}% -> {calculated_progress}%")
                enrollment.progress_percentage = calculated_progress
                
                # Update status based on progress
                if calculated_progress >= 100:
                    enrollment.status = 'completed'
                    if not enrollment.completed_at:
                        enrollment.completed_at = timezone.now()
                else:
                    enrollment.status = 'active'
                
                enrollment.save()
                enrollment.refresh_from_db()
            
            enrollment_dict[enrollment.course_id] = enrollment
            
            print(f"  Course {enrollment.course.id} ({enrollment.course.title}):")
            print(f"    - Completed lessons: {completed_count}/{total_lessons}")
            print(f"    - Progress: {float(enrollment.progress_percentage or 0)}%")
            print(f"    - Status: {enrollment.status}")
        
        # Add enrollment data to each course
        for course_data in courses_data:
            enrollment = enrollment_dict.get(course_data['id'])
            if enrollment:
                # Use the fresh, corrected progress data
                progress = float(enrollment.progress_percentage or 0)
                course_data['progress_percentage'] = progress
                course_data['status'] = enrollment.status
                course_data['enrollment_date'] = enrollment.enrolled_at.isoformat()
                course_data['completed_at'] = enrollment.completed_at.isoformat() if enrollment.completed_at else None
                
                # Add debug info
                completed_count = enrollment.completed_lessons.count()
                total_lessons = enrollment.course.lessons.count()
                course_data['debug_info'] = {
                    'completed_lessons': completed_count,
                    'total_lessons': total_lessons,
                    'enrollment_id': enrollment.id
                }
            else:
                course_data['progress_percentage'] = 0.0
                course_data['status'] = 'not_enrolled'
                course_data['debug_info'] = {'error': 'No enrollment found'}
        
        print(f"MyCoursesView: Returning {len(courses_data)} courses")
        return Response(courses_data)

class MyCreatedCoursesView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Course.objects.filter(instructor=self.request.user).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        courses_data = serializer.data
        
        # For created courses, we don't need enrollment progress data
        # Just return the course data as-is
        for course_data in courses_data:
            course_data['progress_percentage'] = 0.0  # No progress for instructor's own courses
            course_data['status'] = 'instructor'
            course_data['enrollment_date'] = None
            course_data['completed_at'] = None
        
        return Response(courses_data)

class EnrollmentListView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'status', 'course']
    
    def get_queryset(self):
        return Enrollment.objects.all().order_by('-enrolled_at')
    


class CourseLessonsView(generics.ListAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        course_id = self.kwargs.get('course_id')
        
        # Check if user is enrolled or if lessons are preview
        enrollment = Enrollment.objects.filter(
            student=self.request.user, 
            course_id=course_id
        ).first()
        
        if enrollment:
            # Return all lessons for enrolled students
            return Lesson.objects.filter(course_id=course_id).order_by('order')
        else:
            # Return only preview lessons for non-enrolled users
            return Lesson.objects.filter(course_id=course_id, is_preview=True).order_by('order')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        lessons_data = serializer.data
        
        course_id = self.kwargs.get('course_id')
        
        # Get enrollment and add completion status to lessons
        enrollment = Enrollment.objects.filter(
            student=request.user, 
            course_id=course_id
        ).prefetch_related('completed_lessons').first()
        
        if enrollment:
            completed_lesson_ids = set(enrollment.completed_lessons.values_list('id', flat=True))
            
            for lesson_data in lessons_data:
                lesson_data['is_completed'] = lesson_data['id'] in completed_lesson_ids
            
            print(f"CourseLessonsView: Course {course_id}, User {request.user.username}")
            print(f"  - Total lessons: {len(lessons_data)}")
            print(f"  - Completed lessons: {len(completed_lesson_ids)}")
            print(f"  - Completed lesson IDs: {list(completed_lesson_ids)}")
        
        return Response(lessons_data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_lesson_complete(request, lesson_id):
    """Mark a lesson as completed"""
    try:
        lesson = Lesson.objects.get(id=lesson_id)
        enrollment = Enrollment.objects.get(
            student=request.user,
            course=lesson.course
        )
        
        # Force fresh data from database
        enrollment.refresh_from_db()
        
        # Check if lesson is already completed to avoid duplicates
        was_already_completed = enrollment.completed_lessons.filter(id=lesson_id).exists()
        
        if not was_already_completed:
            # Add lesson to completed lessons
            enrollment.completed_lessons.add(lesson)
            print(f"Added lesson {lesson_id} to completed lessons for user {request.user.username}")
        else:
            print(f"Lesson {lesson_id} already completed for user {request.user.username}")
        
        # Recalculate progress percentage with fresh data
        total_lessons = lesson.course.lessons.count()
        completed_count = enrollment.completed_lessons.count()
        new_progress = (completed_count / total_lessons) * 100 if total_lessons > 0 else 0
        
        # Update progress and save
        enrollment.progress_percentage = new_progress
        enrollment.save()
        
        # Force another refresh to ensure data is committed
        enrollment.refresh_from_db()
        
        print(f"Lesson completion status for user {request.user.username}:")
        print(f"  - Lesson {lesson_id}: {lesson.title}")
        print(f"  - Course: {lesson.course.title}")
        print(f"  - Progress: {completed_count}/{total_lessons} = {new_progress}%")
        print(f"  - Enrollment ID: {enrollment.id}")
        print(f"  - Was already completed: {was_already_completed}")
        
        # Check if course is completed
        if enrollment.progress_percentage >= 100 and enrollment.status != 'completed':
            enrollment.status = 'completed'
            enrollment.completed_at = timezone.now()
            enrollment.save()
            print(f"  - Course marked as completed!")
            
            # Award course completion badge
            badge, created = SkillBadge.objects.get_or_create(
                user=request.user,
                course=lesson.course,
                defaults={
                    'badge_type': 'course',
                    'name': f'{lesson.course.title} Completion',
                    'description': f'Completed the course: {lesson.course.title}',
                    'badge_icon': '🎓'
                }
            )
            if created:
                print(f"  - Awarded completion badge!")
        
        # Return comprehensive response
        return Response({
            'message': 'Lesson marked as complete',
            'progress': float(enrollment.progress_percentage),
            'completed_lessons': completed_count,
            'total_lessons': total_lessons,
            'enrollment_id': enrollment.id,
            'lesson_id': lesson_id,
            'was_already_completed': was_already_completed,
            'course_completed': enrollment.status == 'completed'
        })
        
    except Lesson.DoesNotExist:
        print(f"Lesson {lesson_id} not found")
        return Response({'error': 'Lesson not found'}, status=404)
    except Enrollment.DoesNotExist:
        print(f"Enrollment not found for user {request.user.username} and lesson {lesson_id}")
        return Response({'error': 'Enrollment not found'}, status=404)
    except Exception as e:
        print(f"Error marking lesson complete: {str(e)}")
        return Response({'error': f'Internal error: {str(e)}'}, status=500)

class SkillAssessmentListView(generics.ListAPIView):
    queryset = SkillAssessment.objects.filter(status='published')
    serializer_class = SkillAssessmentSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'difficulty_level']
    search_fields = ['title', 'skill_name', 'description']

class SkillAssessmentDetailView(generics.RetrieveAPIView):
    queryset = SkillAssessment.objects.filter(status='published')
    serializer_class = SkillAssessmentSerializer
    permission_classes = [permissions.AllowAny]

class AssessmentQuestionsView(generics.ListAPIView):
    serializer_class = AssessmentQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        assessment_id = self.kwargs.get('assessment_id')
        return AssessmentQuestion.objects.filter(assessment_id=assessment_id)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_assessment(request, assessment_id):
    """Start a new assessment attempt"""
    try:
        assessment = SkillAssessment.objects.get(id=assessment_id)
        
        # Check if user has an active attempt
        active_attempt = AssessmentAttempt.objects.filter(
            user=request.user,
            assessment=assessment,
            status='in_progress'
        ).first()
        
        if active_attempt:
            return Response({
                'attempt_id': active_attempt.id,
                'message': 'Resuming existing attempt'
            })
        
        # Create new attempt
        attempt = AssessmentAttempt.objects.create(
            user=request.user,
            assessment=assessment
        )
        
        return Response({
            'attempt_id': attempt.id,
            'time_limit': assessment.time_limit_minutes,
            'questions_count': assessment.questions.count()
        })
        
    except SkillAssessment.DoesNotExist:
        return Response({'error': 'Assessment not found'}, status=404)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_assessment(request, attempt_id):
    """Submit assessment answers and calculate score"""
    try:
        attempt = AssessmentAttempt.objects.get(
            id=attempt_id,
            user=request.user,
            status='in_progress'
        )
        
        answers = request.data.get('answers', {})
        attempt.answers = answers
        
        # Calculate score
        total_points = 0
        earned_points = 0
        
        for question in attempt.assessment.questions.all():
            total_points += question.points
            user_answer = answers.get(str(question.id), '')
            
            # Simple answer checking (can be enhanced)
            if question.question_type == 'multiple_choice':
                if user_answer == question.correct_answer:
                    earned_points += question.points
            elif question.question_type == 'true_false':
                if user_answer.lower() == question.correct_answer.lower():
                    earned_points += question.points
            elif question.question_type == 'short_answer':
                if user_answer.lower().strip() in question.correct_answer.lower():
                    earned_points += question.points
        
        # Calculate percentage score
        score_percentage = (earned_points / total_points) * 100 if total_points > 0 else 0
        attempt.score = score_percentage
        attempt.passed = score_percentage >= attempt.assessment.passing_score
        attempt.status = 'completed'
        attempt.completed_at = timezone.now()
        attempt.save()
        
        # Award skill badge if passed
        if attempt.passed:
            SkillBadge.objects.get_or_create(
                user=request.user,
                assessment=attempt.assessment,
                defaults={
                    'badge_type': 'skill',
                    'name': f'{attempt.assessment.skill_name} Certified',
                    'description': f'Passed {attempt.assessment.title} with {score_percentage:.1f}%',
                    'skill_name': attempt.assessment.skill_name,
                    'badge_icon': '🏆'
                }
            )
        
        return Response({
            'score': float(score_percentage),
            'passed': attempt.passed,
            'passing_score': attempt.assessment.passing_score,
            'earned_points': earned_points,
            'total_points': total_points
        })
        
    except AssessmentAttempt.DoesNotExist:
        return Response({'error': 'Assessment attempt not found'}, status=404)

class MyAssessmentAttemptsView(generics.ListAPIView):
    serializer_class = AssessmentAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AssessmentAttempt.objects.filter(
            user=self.request.user,
            status='completed'
        ).order_by('-completed_at')

class MySkillBadgesView(generics.ListAPIView):
    serializer_class = SkillBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SkillBadge.objects.filter(user=self.request.user).order_by('-earned_at')

class CourseReviewCreateView(generics.CreateAPIView):
    queryset = CourseReview.objects.all()
    serializer_class = CourseReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        
        # Check if user is enrolled
        if not Enrollment.objects.filter(student=self.request.user, course=course).exists():
            raise ValidationError("You must be enrolled to review this course")
        
        # Check if user already reviewed this course
        if CourseReview.objects.filter(student=self.request.user, course=course).exists():
            raise ValidationError("You have already reviewed this course")
        
        serializer.save(student=self.request.user)
        
        # Update course rating
        from django.db.models import Avg
        reviews = CourseReview.objects.filter(course=course)
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        course.rating = avg_rating
        course.total_reviews = reviews.count()
        course.save()

class CourseReviewListView(generics.ListCreateAPIView):
    serializer_class = CourseReviewSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        course_id = self.kwargs.get('course_id')
        return CourseReview.objects.filter(course_id=course_id).order_by('-created_at')
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        course_id = self.kwargs.get('course_id')
        course = Course.objects.get(id=course_id)
        
        # Check if user is enrolled
        if not Enrollment.objects.filter(student=self.request.user, course=course).exists():
            raise ValidationError("You must be enrolled to review this course")
        
        # Check if user already reviewed this course
        if CourseReview.objects.filter(student=self.request.user, course=course).exists():
            raise ValidationError("You have already reviewed this course")
        
        serializer.save(student=self.request.user, course=course)
        
        # Update course rating
        from django.db.models import Avg
        reviews = CourseReview.objects.filter(course=course)
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        course.rating = avg_rating
        course.total_reviews = reviews.count()
        course.save()

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def learning_dashboard(request):
    """Get learning dashboard statistics"""
    user = request.user
    
    # Enrollment statistics
    enrollments = Enrollment.objects.filter(student=user)
    total_courses = enrollments.count()
    completed_courses = enrollments.filter(status='completed').count()
    in_progress_courses = enrollments.filter(status='active').count()
    
    # Progress data
    progress_data = []
    for enrollment in enrollments.filter(status='active')[:5]:
        progress_data.append({
            'course_title': enrollment.course.title,
            'progress': float(enrollment.progress_percentage),
            'course_id': enrollment.course.id
        })
    
    # Skill badges
    badges = SkillBadge.objects.filter(user=user)
    skill_badges = badges.filter(badge_type='skill').count()
    course_badges = badges.filter(badge_type='course').count()
    
    # Assessment statistics
    attempts = AssessmentAttempt.objects.filter(user=user, status='completed')
    total_assessments = attempts.count()
    passed_assessments = attempts.filter(passed=True).count()
    
    # Recent activity
    recent_badges = badges.order_by('-earned_at')[:3]
    recent_completions = enrollments.filter(status='completed').order_by('-completed_at')[:3]
    
    return Response({
        'total_courses': total_courses,
        'completed_courses': completed_courses,
        'completed_courses_count': completed_courses,
        'in_progress_courses': in_progress_courses,
        'progress_data': progress_data,
        'skill_badges': skill_badges,
        'course_badges': course_badges,
        'total_assessments': total_assessments,
        'passed_assessments': passed_assessments,
        'recent_badges': SkillBadgeSerializer(recent_badges, many=True).data,
        'recent_completions': CourseSerializer([
            completion.course for completion in recent_completions
        ], many=True).data
    })

# Admin & Moderation Views
class IsAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow Django staff/superuser OR a designated admin email for development
        return request.user.is_authenticated and (
            request.user.is_staff or request.user.is_superuser or getattr(request.user, 'email', '').lower() == 'kbrian1237@gmail.com'
        )

@api_view(['GET'])
@permission_classes([IsAdminPermission])
def admin_dashboard_stats(request):
    """Get admin dashboard statistics"""
    from django.db.models import Sum, Count, Q
    from datetime import datetime, timedelta
    
    # User statistics
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    
    # Order statistics
    total_orders = Order.objects.count()
    completed_orders = Order.objects.filter(status='completed').count()
    
    # Dispute and report statistics
    pending_disputes = Dispute.objects.filter(status='open').count()
    pending_reports = ContentReport.objects.filter(status='pending').count()
    
    # Revenue statistics
    total_revenue = Order.objects.filter(status='completed').aggregate(
        total=Sum('price')
    )['total'] or 0
    
    # Monthly revenue for last 6 months
    monthly_revenue = []
    for i in range(6):
        month_start = datetime.now().replace(day=1) - timedelta(days=30*i)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        revenue = Order.objects.filter(
            status='completed',
            completed_at__range=[month_start, month_end]
        ).aggregate(total=Sum('price'))['total'] or 0
        
        monthly_revenue.insert(0, float(revenue))
    
    # User growth for last 6 months
    user_growth = []
    for i in range(6):
        month_start = datetime.now().replace(day=1) - timedelta(days=30*i)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        new_users = User.objects.filter(
            date_joined__range=[month_start, month_end]
        ).count()
        
        user_growth.insert(0, new_users)
    
    # Order status distribution
    order_stats = {}
    for status, _ in Order.ORDER_STATUS:
        count = Order.objects.filter(status=status).count()
        order_stats[status] = count
    
    # Category statistics
    category_stats = []
    for category in Category.objects.all():
        gigs_count = category.gigs.count()
        orders_count = Order.objects.filter(gig__category=category).count()
        category_stats.append({
            'name': category.name,
            'gigs': gigs_count,
            'orders': orders_count
        })
    # Recent activities: collect latest events across key models
    recent_items = []
    try:
        recent_users = User.objects.order_by('-date_joined')[:5]
        for u in recent_users:
            recent_items.append({'description': f"New user: {u.username}", 'timestamp': u.date_joined.isoformat() if u.date_joined else None})
    except Exception:
        pass
    try:
        recent_gigs = Gig.objects.order_by('-created_at')[:5]
        for g in recent_gigs:
            recent_items.append({'description': f"Gig created: {g.title}", 'timestamp': g.created_at.isoformat() if g.created_at else None})
    except Exception:
        pass
    try:
        recent_orders = Order.objects.order_by('-created_at')[:5]
        for o in recent_orders:
            recent_items.append({'description': f"Order created: #{o.id} {o.title or ''}", 'timestamp': o.created_at.isoformat() if o.created_at else None})
    except Exception:
        pass
    try:
        recent_jobs = Job.objects.order_by('-created_at')[:5]
        for j in recent_jobs:
            recent_items.append({'description': f"Job posted: {j.title}", 'timestamp': j.created_at.isoformat() if j.created_at else None})
    except Exception:
        pass
    try:
        recent_projects = Project.objects.order_by('-created_at')[:5]
        for p in recent_projects:
            recent_items.append({'description': f"Project created: {p.title}", 'timestamp': p.created_at.isoformat() if p.created_at else None})
    except Exception:
        pass
    try:
        recent_courses = Course.objects.order_by('-created_at')[:5]
        for c in recent_courses:
            recent_items.append({'description': f"Course published: {c.title}", 'timestamp': c.created_at.isoformat() if c.created_at else None})
    except Exception:
        pass
    # Sort by timestamp desc and keep top 10
    recent_activities = [x for x in recent_items if x.get('timestamp')]
    recent_activities.sort(key=lambda x: x['timestamp'], reverse=True)
    recent_activities = recent_activities[:10]
    
    return Response({
        'total_users': total_users,
        'active_users': active_users,
        'total_orders': total_orders,
        'completed_orders': completed_orders,
        'pending_disputes': pending_disputes,
        'pending_reports': pending_reports,
        'total_revenue': float(total_revenue),
        'monthly_revenue': monthly_revenue,
        'user_growth': user_growth,
        'order_stats': order_stats,
        'category_stats': category_stats,
        'recent_activities': recent_activities
    })

# Dispute Management Views
class DisputeCreateView(generics.CreateAPIView):
    queryset = Dispute.objects.all()
    serializer_class = DisputeSerializer
    permission_classes = [permissions.IsAuthenticated]

class DisputeListView(generics.ListAPIView):
    serializer_class = DisputeSerializer
    permission_classes = [IsAdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'category']
    search_fields = ['title', 'complainant__username', 'respondent__username']
    
    def get_queryset(self):
        return Dispute.objects.all().order_by('-created_at')

class DisputeDetailView(generics.RetrieveUpdateAPIView):
    queryset = Dispute.objects.all()
    serializer_class = DisputeSerializer
    permission_classes = [IsAdminPermission]

@api_view(['POST'])
@permission_classes([IsAdminPermission])
def resolve_dispute(request, dispute_id):
    """Resolve a dispute with admin decision"""
    try:
        dispute = Dispute.objects.get(id=dispute_id)
    except Dispute.DoesNotExist:
        return Response({'error': 'Dispute not found'}, status=404)
    
    resolution = request.data.get('resolution', '')
    action = request.data.get('action', '')  # 'refund', 'release', 'partial'
    
    dispute.status = 'resolved'
    dispute.resolution = resolution
    dispute.resolved_at = timezone.now()
    dispute.assigned_admin = request.user
    dispute.save()
    
    # Execute resolution action
    order = dispute.order
    if action == 'refund':
        order.status = 'cancelled'
        order.save()
        AdminAction.objects.create(
            admin=request.user,
            action_type='refund_process',
            target_user=order.client,
            description=f'Dispute resolved with refund for order #{order.id}'
        )
    elif action == 'release':
        if not order.escrow_released:
            order.escrow_released = True
            order.status = 'completed'
            order.save()
            
            # Update freelancer balance
            freelancer_profile = order.freelancer.userprofile
            freelancer_profile.available_balance += order.price
            freelancer_profile.total_earnings += order.price
            freelancer_profile.save()
            
            AdminAction.objects.create(
                admin=request.user,
                action_type='payment_release',
                target_user=order.freelancer,
                description=f'Dispute resolved with payment release for order #{order.id}'
            )
    
    return Response({'message': 'Dispute resolved successfully'})

# Content Moderation Views
class ContentReportCreateView(generics.CreateAPIView):
    queryset = ContentReport.objects.all()
    serializer_class = ContentReportSerializer
    permission_classes = [permissions.IsAuthenticated]

class ContentReportListView(generics.ListAPIView):
    serializer_class = ContentReportSerializer
    permission_classes = [IsAdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'report_type']
    search_fields = ['reason', 'reporter__username']
    
    def get_queryset(self):
        return ContentReport.objects.all().order_by('-created_at')

class ContentReportDetailView(generics.RetrieveUpdateAPIView):
    queryset = ContentReport.objects.all()
    serializer_class = ContentReportSerializer
    permission_classes = [IsAdminPermission]

@api_view(['POST'])
@permission_classes([IsAdminPermission])
def moderate_content(request, report_id):
    """Take moderation action on reported content"""
    try:
        report = ContentReport.objects.get(id=report_id)
    except ContentReport.DoesNotExist:
        return Response({'error': 'Report not found'}, status=404)
    
    action = request.data.get('action', '')  # 'approve', 'remove', 'suspend_user'
    notes = request.data.get('notes', '')
    
    report.status = 'resolved'
    report.admin_notes = notes
    report.reviewed_by = request.user
    report.reviewed_at = timezone.now()
    
    if action == 'remove':
        # Remove content based on type
        if report.content_type == 'gig':
            try:
                gig = Gig.objects.get(id=report.content_id)
                gig.is_active = False
                gig.save()
                report.action_taken = 'Content removed - Gig deactivated'
            except Gig.DoesNotExist:
                pass
        elif report.content_type == 'job':
            try:
                job = Job.objects.get(id=report.content_id)
                job.status = 'closed'
                job.save()
                report.action_taken = 'Content removed - Job closed'
            except Job.DoesNotExist:
                pass
        
        AdminAction.objects.create(
            admin=request.user,
            action_type='content_remove',
            description=f'Removed {report.content_type} #{report.content_id} due to report'
        )
    
    elif action == 'suspend_user':
        # Suspend the user who created the content
        try:
            if report.content_type == 'gig':
                gig = Gig.objects.get(id=report.content_id)
                user_to_suspend = gig.freelancer
            elif report.content_type == 'job':
                job = Job.objects.get(id=report.content_id)
                user_to_suspend = job.client
            else:
                user_to_suspend = None
            
            if user_to_suspend:
                user_to_suspend.is_active = False
                user_to_suspend.save()
                report.action_taken = f'User {user_to_suspend.username} suspended'
                
                AdminAction.objects.create(
                    admin=request.user,
                    action_type='user_suspend',
                    target_user=user_to_suspend,
                    description=f'User suspended due to content report #{report.id}'
                )
        except (Gig.DoesNotExist, Job.DoesNotExist):
            pass
    
    elif action == 'approve':
        report.action_taken = 'No action taken - Content approved'
        AdminAction.objects.create(
            admin=request.user,
            action_type='content_approve',
            description=f'Approved {report.content_type} #{report.content_id} after review'
        )
    
    report.save()
    return Response({'message': 'Moderation action completed'})

# System Settings Views
class SystemSettingsListView(generics.ListAPIView):
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAdminPermission]

class SystemSettingsUpdateView(generics.RetrieveUpdateAPIView):
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAdminPermission]
    lookup_field = 'key'

# Admin Action Log Views
class AdminActionListView(generics.ListAPIView):
    queryset = AdminAction.objects.all().order_by('-created_at')
    serializer_class = AdminActionSerializer
    permission_classes = [IsAdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['action_type', 'admin']
    search_fields = ['description', 'admin__username', 'target_user__username']
# Enhanced Notification Views
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationWithPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['notification_type', 'is_read']
    search_fields = ['title', 'message']
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def real_time_notifications(request):
    """Get real-time notifications for polling"""
    last_check = request.GET.get('last_check')
    queryset = Notification.objects.filter(user=request.user)
    
    if last_check:
        try:
            from datetime import datetime
            last_check_dt = datetime.fromisoformat(last_check.replace('Z', '+00:00'))
            queryset = queryset.filter(created_at__gt=last_check_dt)
        except:
            pass
    
    notifications = queryset.order_by('-created_at')[:10]
    unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
    
    return Response({
        'notifications': NotificationWithPreferencesSerializer(notifications, many=True).data,
        'unread_count': unread_count,
        'timestamp': timezone.now().isoformat()
    })

# Notification Preferences Views
class NotificationPreferenceListView(generics.ListAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)

class NotificationPreferenceUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_notification_preferences(request):
    """Bulk update notification preferences"""
    preferences_data = request.data.get('preferences', [])
    
    for pref_data in preferences_data:
        category = pref_data.get('category')
        delivery_method = pref_data.get('delivery_method')
        is_enabled = pref_data.get('is_enabled', True)
        frequency = pref_data.get('frequency', 'instant')
        
        if category and delivery_method:
            NotificationPreference.objects.update_or_create(
                user=request.user,
                category=category,
                delivery_method=delivery_method,
                defaults={
                    'is_enabled': is_enabled,
                    'frequency': frequency
                }
            )
    
    return Response({'message': 'Preferences updated successfully'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_notification_settings(request):
    """Get user's notification settings with defaults"""
    from .notification_service import NotificationService
    
    # Ensure user has default preferences
    NotificationService.get_default_preferences(request.user)
    
    preferences = NotificationPreference.objects.filter(user=request.user)
    
    # Group by category
    settings = {}
    for pref in preferences:
        if pref.category not in settings:
            settings[pref.category] = {}
        settings[pref.category][pref.delivery_method] = {
            'is_enabled': pref.is_enabled,
            'frequency': pref.frequency
        }
    
    return Response({
        'settings': settings,
        'categories': NotificationPreference.NOTIFICATION_CATEGORIES,
        'delivery_methods': NotificationPreference.DELIVERY_METHODS,
        'frequency_options': NotificationPreference.FREQUENCY_SETTINGS
    })

# Notification Templates (Admin only)
class NotificationTemplateListView(generics.ListCreateAPIView):
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAdminPermission]

class NotificationTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAdminPermission]

@api_view(['POST'])
@permission_classes([IsAdminPermission])
def send_system_notification(request):
    """Send system-wide notification to all users or specific groups"""
    title = request.data.get('title')
    message = request.data.get('message')
    user_type = request.data.get('user_type', 'all')  # all, client, freelancer
    
    if not title or not message:
        return Response({'error': 'Title and message are required'}, status=400)
    
    # Get target users
    if user_type == 'client':
        users = User.objects.filter(userprofile__user_type__in=['client', 'both'])
    elif user_type == 'freelancer':
        users = User.objects.filter(userprofile__user_type__in=['freelancer', 'both'])
    else:
        users = User.objects.filter(is_active=True)
    
    # Create notifications
    notifications_created = 0
    for user in users:
        Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type='system'
        )
        notifications_created += 1
    
    return Response({
        'message': f'System notification sent to {notifications_created} users',
        'count': notifications_created
    })
# Error Handling Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def log_error(request):
    """Log frontend errors for debugging"""
    try:
        data = request.data
        
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip_address = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
        
        # Determine error type
        error_type = 'javascript'
        if 'network' in data.get('message', '').lower():
            error_type = 'network'
        elif 'api' in data.get('message', '').lower():
            error_type = 'api'
        
        ErrorLog.objects.create(
            error_type=error_type,
            message=data.get('message', '')[:1000],  # Limit message length
            stack_trace=data.get('stack', '')[:5000],  # Limit stack trace
            url=data.get('url', ''),
            user_agent=data.get('userAgent', ''),
            user=request.user if request.user.is_authenticated else None,
            ip_address=ip_address
        )
        
        return Response({'status': 'logged'})
    except Exception as e:
        # Don't let error logging fail the request
        return Response({'status': 'failed', 'error': str(e)})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def refresh_token(request):
    """Refresh user token to extend session"""
    try:
        # Create new token
        request.user.auth_token.delete()
        token = Token.objects.create(user=request.user)
        
        return Response({
            'token': token.key,
            'user': UserSerializer(request.user).data
        })
    except Exception as e:
        return Response({'error': 'Token refresh failed'}, status=400)

# Session Management Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def session_status(request):
    """Check session status and return time until expiry"""
    try:
        token = request.auth
        # For Token auth, tokens don't expire by default
        # This is a placeholder for JWT implementation
        return Response({
            'valid': True,
            'expires_in': 3600,  # 1 hour placeholder
            'user': UserSerializer(request.user).data
        })
    except Exception as e:
        return Response({'valid': False}, status=401)

# Error Log Management (Admin only)
class ErrorLogListView(generics.ListAPIView):
    queryset = ErrorLog.objects.all()
    serializer_class = ErrorLogSerializer
    permission_classes = [IsAdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['error_type', 'resolved']
    search_fields = ['message', 'url']

@api_view(['POST'])
@permission_classes([IsAdminPermission])
def mark_error_resolved(request, error_id):
    """Mark error as resolved"""
    try:
        error_log = ErrorLog.objects.get(id=error_id)
        error_log.resolved = True
        error_log.save()
        return Response({'message': 'Error marked as resolved'})
    except ErrorLog.DoesNotExist:
        return Response({'error': 'Error log not found'}, status=404)

# Analytics Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_analytics(request):
    """Get user analytics and performance metrics"""
    from .models import UserAnalytics
    from .serializers import UserAnalyticsSerializer
    from django.db.models import Sum, Count, Q
    
    analytics, created = UserAnalytics.objects.get_or_create(user=request.user)
    
    # Update analytics data
    analytics.total_orders = Order.objects.filter(
        Q(client=request.user) | Q(freelancer=request.user)
    ).count()
    
    if request.user.userprofile.user_type in ['freelancer', 'both']:
        analytics.total_earnings = Order.objects.filter(
            freelancer=request.user, status='completed'
        ).aggregate(total=Sum('price'))['total'] or 0
    
    if request.user.userprofile.user_type in ['client', 'both']:
        analytics.total_spent = Order.objects.filter(
            client=request.user, status='completed'
        ).aggregate(total=Sum('price'))['total'] or 0
    
    analytics.save()
    
    serializer = UserAnalyticsSerializer(analytics)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_performance_metrics(request):
    """Get detailed performance metrics with date range"""
    from datetime import datetime, timedelta
    
    user = request.user
    date_range = int(request.GET.get('range', 30))  # days
    start_date = datetime.now() - timedelta(days=date_range)
    
    # Get performance data
    orders = Order.objects.filter(
        Q(client=user) | Q(freelancer=user),
        created_at__gte=start_date
    )
    
    # Calculate metrics
    metrics = {
        'total_orders': orders.count(),
        'completed_orders': orders.filter(status='completed').count(),
        'avg_rating': float(user.userprofile.rating),
        'response_time': 0,  # Calculate based on message response times
        'earnings_trend': [],
        'order_trend': [],
        'category_breakdown': []
    }
    
    # Get earnings/spending trend
    for i in range(date_range):
        date = start_date + timedelta(days=i)
        day_orders = orders.filter(created_at__date=date.date())
        
        if user.userprofile.user_type in ['freelancer', 'both']:
            earnings = day_orders.filter(
                freelancer=user, status='completed'
            ).aggregate(total=Sum('price'))['total'] or 0
            metrics['earnings_trend'].append({
                'date': date.strftime('%Y-%m-%d'),
                'value': float(earnings)
            })
        
        metrics['order_trend'].append({
            'date': date.strftime('%Y-%m-%d'),
            'value': day_orders.count()
        })
    
    return Response(metrics)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def track_event(request):
    """Track analytics events"""
    from .models import AnalyticsEvent
    from .serializers import AnalyticsEventSerializer
    
    serializer = AnalyticsEventSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'event tracked'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAdminPermission])
def platform_analytics(request):
    """Get platform-wide analytics for admin dashboard"""
    from datetime import datetime, timedelta
    from django.db.models import Sum, Count
    
    # Get date range
    days = int(request.GET.get('days', 30))
    start_date = datetime.now() - timedelta(days=days)
    
    # Calculate platform metrics
    total_users = User.objects.count()
    new_users = User.objects.filter(date_joined__gte=start_date).count()
    active_users = User.objects.filter(last_login__gte=start_date).count()
    
    total_orders = Order.objects.count()
    total_revenue = Order.objects.filter(
        status='completed'
    ).aggregate(total=Sum('price'))['total'] or 0
    
    # Daily analytics for the period
    daily_analytics = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        day_users = User.objects.filter(date_joined__date=date.date()).count()
        day_orders = Order.objects.filter(created_at__date=date.date()).count()
        day_revenue = Order.objects.filter(
            created_at__date=date.date(), status='completed'
        ).aggregate(total=Sum('price'))['total'] or 0
        
        daily_analytics.append({
            'date': date.strftime('%Y-%m-%d'),
            'new_users': day_users,
            'orders': day_orders,
            'revenue': float(day_revenue)
        })
    
    return Response({
        'total_users': total_users,
        'new_users': new_users,
        'active_users': active_users,
        'total_orders': total_orders,
        'total_revenue': float(total_revenue),
        'daily_analytics': daily_analytics
    })

# Integration Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_integrations(request):
    """List user's third-party integrations"""
    from .models import ThirdPartyIntegration
    from .serializers import ThirdPartyIntegrationSerializer
    
    integrations = ThirdPartyIntegration.objects.filter(user=request.user)
    serializer = ThirdPartyIntegrationSerializer(integrations, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def connect_integration(request):
    """Connect a third-party integration"""
    from .models import ThirdPartyIntegration, IntegrationSync
    from .serializers import ThirdPartyIntegrationSerializer
    
    provider = request.data.get('provider')
    access_token = request.data.get('access_token')
    
    if not provider or not access_token:
        return Response(
            {'error': 'Provider and access_token required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create or update integration
    integration, created = ThirdPartyIntegration.objects.get_or_create(
        user=request.user,
        provider=provider,
        defaults={
            'provider_user_id': request.data.get('provider_user_id', ''),
            'access_token': access_token,
            'refresh_token': request.data.get('refresh_token', ''),
        }
    )
    
    if not created:
        integration.access_token = access_token
        integration.refresh_token = request.data.get('refresh_token', '')
        integration.is_active = True
        integration.save()
    
    # Start initial sync
    sync = IntegrationSync.objects.create(
        integration=integration,
        sync_type='profile_import',
        status='pending'
    )
    
    serializer = ThirdPartyIntegrationSerializer(integration)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def disconnect_integration(request, provider):
    """Disconnect a third-party integration"""
    from .models import ThirdPartyIntegration
    
    try:
        integration = ThirdPartyIntegration.objects.get(
            user=request.user, provider=provider
        )
        integration.delete()
        return Response({'status': 'disconnected'}, status=status.HTTP_200_OK)
    except ThirdPartyIntegration.DoesNotExist:
        return Response(
            {'error': 'Integration not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def sync_integration(request, provider):
    """Sync data from a third-party integration"""
    from .models import ThirdPartyIntegration, IntegrationSync
    from .serializers import IntegrationSyncSerializer
    
    try:
        integration = ThirdPartyIntegration.objects.get(
            user=request.user, provider=provider
        )
        
        sync_type = request.data.get('sync_type', 'profile_import')
        
        # Create sync record
        sync = IntegrationSync.objects.create(
            integration=integration,
            sync_type=sync_type,
            status='pending'
        )
        
        # Simulate sync process (in real implementation, this would be async)
        if provider == 'linkedin':
            # LinkedIn profile import logic
            sync.sync_data = {
                'profile_imported': True,
                'skills_updated': True
            }
        elif provider == 'github':
            # GitHub portfolio sync logic
            sync.sync_data = {
                'repositories_synced': 5,
                'portfolio_updated': True
            }
        
        sync.status = 'completed'
        sync.completed_at = timezone.now()
        sync.save()
        
        integration.last_sync = timezone.now()
        integration.save()
        
        serializer = IntegrationSyncSerializer(sync)
        return Response(serializer.data)
        
    except ThirdPartyIntegration.DoesNotExist:
        return Response(
            {'error': 'Integration not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def integration_sync_history(request, provider):
    """Get sync history for an integration"""
    from .models import ThirdPartyIntegration, IntegrationSync
    from .serializers import IntegrationSyncSerializer
    
    try:
        integration = ThirdPartyIntegration.objects.get(
            user=request.user, provider=provider
        )
        syncs = IntegrationSync.objects.filter(integration=integration)
        serializer = IntegrationSyncSerializer(syncs, many=True)
        return Response(serializer.data)
    except ThirdPartyIntegration.DoesNotExist:
        return Response(
            {'error': 'Integration not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_database_tables(request):
    """Get list of all database tables"""
    from django.db import connection
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
        tables = [row[0] for row in cursor.fetchall()]
    
    return Response({'tables': tables})

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def available_integrations(request):
    """Get list of available integrations"""
    integrations = [
        {
            'provider': 'linkedin',
            'name': 'LinkedIn',
            'description': 'Import your professional profile and skills',
            'features': ['Profile Import', 'Skills Sync', 'Experience Import']
        },
        {
            'provider': 'github',
            'name': 'GitHub',
            'description': 'Sync your repositories and showcase your code',
            'features': ['Repository Sync', 'Portfolio Update', 'Contribution Stats']
        },
        {
            'provider': 'google',
            'name': 'Google Calendar',
            'description': 'Sync your availability and schedule meetings',
            'features': ['Calendar Sync', 'Availability Tracking', 'Meeting Scheduling']
        },
        {
            'provider': 'slack',
            'name': 'Slack',
            'description': 'Get notifications in your Slack workspace',
            'features': ['Notification Sync', 'Team Communication', 'Status Updates']
        },
        {
            'provider': 'zoom',
            'name': 'Zoom',
            'description': 'Schedule and manage video meetings',
            'features': ['Meeting Creation', 'Calendar Integration', 'Recording Management']
        }
    ]
    
    return Response({'integrations': integrations})



@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def websocket_status(request):
    """Check WebSocket server status"""
    try:
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        
        status = {
            'websocket_enabled': True,
            'channel_layer': str(type(channel_layer).__name__),
            'asgi_application': 'neurolancer_backend.asgi.application',
            'websocket_url': 'ws://localhost:8000/ws/messages/',
            'status': 'available'
        }
    except Exception as e:
        status = {
            'websocket_enabled': False,
            'error': str(e),
            'status': 'unavailable',
            'fallback': 'polling_mode'
        }
    
    return Response(status)

# Professional Document Views
class ProfessionalDocumentListView(generics.ListAPIView):
    serializer_class = ProfessionalDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ProfessionalDocument.objects.filter(user=self.request.user)

class ProfessionalDocumentCreateView(generics.CreateAPIView):
    serializer_class = ProfessionalDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ProfessionalDocumentDeleteView(generics.DestroyAPIView):
    serializer_class = ProfessionalDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ProfessionalDocument.objects.filter(user=self.request.user)

# Avatar Management Views
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_avatar(request):
    """Update user avatar"""
    try:
        profile = request.user.userprofile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)
    
    avatar_type = request.data.get('avatar_type')
    selected_avatar = request.data.get('selected_avatar')
    profile_picture = request.FILES.get('profile_picture')
    
    if avatar_type == 'avatar' and selected_avatar:
        profile.avatar_type = 'avatar'
        profile.selected_avatar = selected_avatar
        profile.save()
        
        return Response({
            'message': 'Avatar updated successfully',
            'avatar_url': profile.get_avatar_url()
        })
    
    elif avatar_type == 'upload' and profile_picture:
        profile.avatar_type = 'upload'
        profile.profile_picture = profile_picture
        profile.save()
        
        return Response({
            'message': 'Profile picture updated successfully',
            'avatar_url': profile.get_avatar_url(),
            'profile_picture': profile.profile_picture.url if profile.profile_picture else None
        })
    
    return Response({'error': 'Invalid avatar data'}, status=400)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_available_avatars(request):
    """Get list of available avatars"""
    avatars = [
        'user', 'man', 'girl', 'boy', 'chinese', 'french', 'arab', 'indian', 
        'scientist', 'doctor', 'dj', 'cowboy', 'ninja', 'police'
    ]
    
    return Response({
        'avatars': avatars,
        'base_url': '/speckyboy-free-avatar-icon-set/SVG/1 de 3 Avatars FLAT/'
    })

# Contact & Feedback Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def submit_contact_form(request):
    """Handle contact form submissions"""
    name = request.data.get('name', '')
    email = request.data.get('email', '')
    subject = request.data.get('subject', '')
    message = request.data.get('message', '')
    
    if not all([name, email, subject, message]):
        return Response({'error': 'All fields are required'}, status=400)
    
    try:
        # Send HTML email to admin
        admin_html = render_to_string('emails/contact_admin.html', {
            'name': name, 'email': email, 'subject': subject, 'message': message
        })
        admin_text = strip_tags(admin_html)
        
        send_mail(
            f'Contact Form: {subject}',
            admin_text,
            settings.DEFAULT_FROM_EMAIL,
            ['neurolancermail@gmail.com'],
            html_message=admin_html,
            fail_silently=False,
        )
        
        # Send HTML confirmation to user
        user_html = render_to_string('emails/contact_user.html', {
            'name': name, 'subject': subject, 'message': message
        })
        user_text = strip_tags(user_html)
        
        send_mail(
            'Thank you for contacting Neurolancer',
            user_text,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=user_html,
            fail_silently=True,
        )
        
        return Response({
            'message': 'Contact form submitted successfully. We will get back to you soon!',
            'success': True
        })
        
    except Exception as e:
        print(f"Failed to send contact form email: {e}")
        return Response({
            'error': 'Failed to send message. Please try again later.',
            'success': False
        }, status=500)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def submit_feedback_form(request):
    """Handle feedback form submissions"""
    name = request.data.get('name', '')
    email = request.data.get('email', '')
    feedback_type = request.data.get('feedback_type', '')
    rating = request.data.get('rating', 0)
    message = request.data.get('message', '')
    
    if not all([name, email, feedback_type, message]):
        return Response({'error': 'All fields except rating are required'}, status=400)
    
    try:
        # Send HTML email to admin
        admin_html = render_to_string('emails/feedback_admin.html', {
            'name': name, 'email': email, 'feedback_type': feedback_type.replace('_', ' ').title(),
            'rating': rating, 'message': message
        })
        admin_text = strip_tags(admin_html)
        
        send_mail(
            f'Feedback: {feedback_type.replace("_", " ").title()}',
            admin_text,
            settings.DEFAULT_FROM_EMAIL,
            ['neurolancermail@gmail.com'],
            html_message=admin_html,
            fail_silently=False,
        )
        
        # Send HTML confirmation to user
        user_html = render_to_string('emails/feedback_user.html', {
            'name': name, 'feedback_type': feedback_type.replace('_', ' ').title(),
            'rating': rating, 'message': message
        })
        user_text = strip_tags(user_html)
        
        send_mail(
            'Thank you for your feedback',
            user_text,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=user_html,
            fail_silently=True,
        )
        
        return Response({
            'message': 'Feedback submitted successfully. Thank you for helping us improve!',
            'success': True
        })
        
    except Exception as e:
        print(f"Failed to send feedback email: {e}")
        return Response({
            'error': 'Failed to send feedback. Please try again later.',
            'success': False
        }, status=500)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def debug_enrollment_status(request, course_id):
    try:
        enrollment = Enrollment.objects.get(student=request.user, course_id=course_id)
        enrollment.refresh_from_db()
        
        completed_lessons = enrollment.completed_lessons.all()
        total_lessons = enrollment.course.lessons.count()
        
        # Get detailed lesson info
        all_lessons = enrollment.course.lessons.all().order_by('order')
        lesson_details = []
        
        for lesson in all_lessons:
            is_completed = lesson in completed_lessons
            lesson_details.append({
                'id': lesson.id,
                'title': lesson.title,
                'order': lesson.order,
                'is_completed': is_completed
            })
        
        # Recalculate progress
        calculated_progress = (completed_lessons.count() / total_lessons) * 100 if total_lessons > 0 else 0
        
        return Response({
            'enrollment_id': enrollment.id,
            'course_id': course_id,
            'course_title': enrollment.course.title,
            'student': request.user.username,
            'progress_percentage': float(enrollment.progress_percentage or 0),
            'calculated_progress': calculated_progress,
            'completed_lessons_count': completed_lessons.count(),
            'total_lessons': total_lessons,
            'status': enrollment.status,
            'enrolled_at': enrollment.enrolled_at.isoformat(),
            'completed_lesson_ids': list(completed_lessons.values_list('id', flat=True)),
            'lesson_details': lesson_details,
            'progress_matches': abs(float(enrollment.progress_percentage or 0) - calculated_progress) < 0.01
        })
    except Enrollment.DoesNotExist:
        return Response({'error': 'Not enrolled'}, status=404)
    except Exception as e:
        return Response({'error': f'Debug error: {str(e)}'}, status=500)

# Like/Dislike Views
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_like(request):
    """Toggle like/dislike for freelancer, job, or gig"""
    content_type = request.data.get('content_type')
    object_id = request.data.get('object_id')
    is_like = request.data.get('is_like', True)
    
    if not content_type or not object_id:
        return Response({'error': 'content_type and object_id required'}, status=400)
    
    if content_type not in ['freelancer', 'job', 'gig']:
        return Response({'error': 'Invalid content_type'}, status=400)
    
    # Verify object exists
    try:
        if content_type == 'freelancer':
            UserProfile.objects.get(user_id=object_id)
        elif content_type == 'job':
            Job.objects.get(id=object_id)
        elif content_type == 'gig':
            Gig.objects.get(id=object_id)
    except (UserProfile.DoesNotExist, Job.DoesNotExist, Gig.DoesNotExist):
        return Response({'error': f'{content_type.title()} not found'}, status=404)
    
    # Get or create like record
    like_obj, created = Like.objects.get_or_create(
        user=request.user,
        content_type=content_type,
        object_id=object_id,
        defaults={'is_like': is_like}
    )
    
    if not created:
        if like_obj.is_like == is_like:
            # Same action - remove like/dislike
            like_obj.delete()
            action = 'removed'
        else:
            # Different action - toggle
            like_obj.is_like = is_like
            like_obj.save()
            action = 'toggled'
    else:
        action = 'added'
    
    # Update counts
    update_like_counts(content_type, object_id)
    
    # Get updated counts
    counts = get_like_counts(content_type, object_id)
    
    return Response({
        'action': action,
        'is_like': is_like,
        'likes_count': counts['likes_count'],
        'dislikes_count': counts['dislikes_count']
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_like_status(request, content_type, object_id):
    """Get like status and counts for an object"""
    if content_type not in ['freelancer', 'job', 'gig']:
        return Response({'error': 'Invalid content_type'}, status=400)
    
    counts = get_like_counts(content_type, object_id)
    user_like = None
    
    if request.user.is_authenticated:
        try:
            like_obj = Like.objects.get(
                user=request.user,
                content_type=content_type,
                object_id=object_id
            )
            user_like = like_obj.is_like
        except Like.DoesNotExist:
            pass
    
    return Response({
        'likes_count': counts['likes_count'],
        'dislikes_count': counts['dislikes_count'],
        'user_like': user_like
    })

def update_like_counts(content_type, object_id):
    """Update like/dislike counts for an object"""
    likes_count = Like.objects.filter(
        content_type=content_type,
        object_id=object_id,
        is_like=True
    ).count()
    
    dislikes_count = Like.objects.filter(
        content_type=content_type,
        object_id=object_id,
        is_like=False
    ).count()
    
    if content_type == 'freelancer':
        UserProfile.objects.filter(user_id=object_id).update(
            likes_count=likes_count,
            dislikes_count=dislikes_count
        )
    elif content_type == 'job':
        Job.objects.filter(id=object_id).update(
            likes_count=likes_count,
            dislikes_count=dislikes_count
        )
    elif content_type == 'gig':
        Gig.objects.filter(id=object_id).update(
            likes_count=likes_count,
            dislikes_count=dislikes_count
        )

def get_like_counts(content_type, object_id):
    """Get like/dislike counts for an object"""
    if content_type == 'freelancer':
        try:
            profile = UserProfile.objects.get(user_id=object_id)
            return {
                'likes_count': profile.likes_count,
                'dislikes_count': profile.dislikes_count
            }
        except UserProfile.DoesNotExist:
            return {'likes_count': 0, 'dislikes_count': 0}
    elif content_type == 'job':
        try:
            job = Job.objects.get(id=object_id)
            return {
                'likes_count': job.likes_count,
                'dislikes_count': job.dislikes_count
            }
        except Job.DoesNotExist:
            return {'likes_count': 0, 'dislikes_count': 0}
    elif content_type == 'gig':
        try:
            gig = Gig.objects.get(id=object_id)
            return {
                'likes_count': gig.likes_count,
                'dislikes_count': gig.dislikes_count
            }
        except Gig.DoesNotExist:
            return {'likes_count': 0, 'dislikes_count': 0}
    
    return {'likes_count': 0, 'dislikes_count': 0}

# Admin Management Views
class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'userprofile__user_type']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'last_login']
    ordering = ['-date_joined']
    
    def get_queryset(self):
        return User.objects.all().select_related('userprofile')

class AdminUserUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminPermission]
    http_method_names = ['get', 'put', 'patch', 'delete', 'head', 'options']

    def destroy(self, request, *args, **kwargs):
        # Soft-delete: deactivate user instead of removing row
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return Response({'message': 'User deactivated', 'id': instance.id, 'is_active': instance.is_active})

class AdminGigListView(generics.ListAPIView):
    serializer_class = GigSerializer
    permission_classes = [IsAdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'category', 'freelancer']
    search_fields = ['title', 'description', 'freelancer__username']
    ordering_fields = ['created_at', 'rating', 'basic_price']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Gig.objects.all().select_related('freelancer', 'category')

class AdminGigUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Gig.objects.all()
    serializer_class = GigSerializer
    permission_classes = [IsAdminPermission]

    def destroy(self, request, *args, **kwargs):
        # Soft-delete for admin as well
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return Response({'message': 'Gig deactivated', 'id': instance.id, 'is_active': instance.is_active})

class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'client', 'freelancer']
    search_fields = ['title', 'client__username', 'freelancer__username']
    ordering_fields = ['created_at', 'price', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Order.objects.all().select_related('client', 'freelancer', 'gig')

class AdminProjectListView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'client']
    search_fields = ['title', 'description', 'client__username']
    ordering_fields = ['created_at', 'budget', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Project.objects.all().select_related('client')

class AdminTransactionListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_paid']
    search_fields = ['title', 'client__username', 'freelancer__username', 'payment_reference']
    ordering_fields = ['created_at', 'price']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Order.objects.filter(is_paid=True).select_related('client', 'freelancer')

class AdminActivityListView(generics.ListAPIView):
    serializer_class = AdminActionSerializer
    permission_classes = [IsAdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action_type', 'admin']
    search_fields = ['description', 'admin__username', 'target_user__username']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return AdminAction.objects.all().select_related('admin', 'target_user')

# AI Assistant Views
class AIConversationView(generics.RetrieveUpdateAPIView):
    serializer_class = AIConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        conversation, created = AIConversation.objects.get_or_create(
            user=self.request.user
        )
        return conversation

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_ai_message(request):
    """Save AI conversation message to database"""
    try:
        conversation, created = AIConversation.objects.get_or_create(
            user=request.user
        )
        
        role = request.data.get('role')
        content = request.data.get('content')
        
        if not role or not content:
            return Response({'error': 'Role and content are required'}, status=400)
        
        if role not in ['user', 'assistant']:
            return Response({'error': 'Invalid role'}, status=400)
        
        # Create message
        message = AIMessage.objects.create(
            conversation=conversation,
            role=role,
            content=content
        )
        
        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save()
        
        return Response({
            'message_id': message.id,
            'conversation_id': conversation.id,
            'created_at': message.created_at.isoformat()
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_ai_conversation(request):
    """Get AI conversation history from database"""
    try:
        conversation = AIConversation.objects.get(user=request.user)
        serializer = AIConversationSerializer(conversation)
        return Response(serializer.data)
    except AIConversation.DoesNotExist:
        return Response({
            'id': None,
            'messages': [],
            'created_at': None,
            'updated_at': None
        })

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def clear_ai_conversation(request):
    """Clear AI conversation history"""
    try:
        conversation = AIConversation.objects.get(user=request.user)
        conversation.messages.all().delete()
        conversation.updated_at = timezone.now()
        conversation.save()
        
        return Response({'message': 'Conversation cleared successfully'})
    except AIConversation.DoesNotExist:
        return Response({'message': 'No conversation to clear'})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def force_refresh_conversation(request, conversation_id):
    """Force refresh conversation messages"""
    try:
        conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        
        # Force update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save()
        
        # Get fresh message count
        message_count = Message.objects.filter(conversation=conversation).count()
        latest_message = Message.objects.filter(conversation=conversation).order_by('-created_at').first()
        
        return Response({
            'conversation_id': conversation_id,
            'message_count': message_count,
            'latest_message': {
                'id': latest_message.id,
                'content': latest_message.content[:50] + '...',
                'sender': latest_message.sender.username,
                'created_at': latest_message.created_at.isoformat()
            } if latest_message else None,
            'refreshed_at': timezone.now().isoformat()
        })
        
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=404)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def debug_conversation_messages(request, conversation_id):
    """Debug endpoint to check messages in a conversation"""
    try:
        conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        
        # Get all messages with fresh query
        messages = Message.objects.filter(conversation=conversation).select_related('sender').order_by('-created_at')[:10]
        
        message_data = []
        for msg in messages:
            message_data.append({
                'id': msg.id,
                'content': msg.content[:100] + '...' if len(msg.content) > 100 else msg.content,
                'sender': msg.sender.username,
                'created_at': msg.created_at.isoformat(),
                'is_read': msg.is_read
            })
        
        return Response({
            'conversation_id': conversation_id,
            'conversation_name': conversation.name,
            'total_messages': Message.objects.filter(conversation=conversation).count(),
            'participants': [p.username for p in conversation.participants.all()],
            'latest_messages': message_data,
            'conversation_updated_at': conversation.updated_at.isoformat() if conversation.updated_at else None
        })
        
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found or no access'}, status=404)