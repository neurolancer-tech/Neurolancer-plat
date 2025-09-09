from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from django.db.models import Q
from datetime import datetime, timedelta
import secrets

from .models import (
    NewsletterSubscriber, Newsletter, NewsletterSendLog, 
    NewsletterTemplate, NewsletterContent
)
from .newsletter_serializers import (
    NewsletterSubscriberSerializer, NewsletterSerializer, NewsletterListSerializer,
    NewsletterSendLogSerializer, NewsletterTemplateSerializer, NewsletterContentSerializer,
    NewsletterSubscriptionSerializer
)

def send_newsletter_email(subscriber, newsletter):
    """Send newsletter email to subscriber"""
    try:
        # Create tracking log
        send_log = NewsletterSendLog.objects.create(
            newsletter=newsletter,
            subscriber=subscriber,
            status='pending'
        )
        
        # Prepare email content
        subject = newsletter.subject
        html_content = newsletter.content
        plain_content = newsletter.plain_text_content or "Please view this email in HTML format."
        
        # Add tracking pixels and unsubscribe link
        tracking_pixel = f'<img src="{settings.FRONTEND_URL}/api/newsletter/track/open/{send_log.tracking_id}/" width="1" height="1" style="display:none;">'
        unsubscribe_link = f'{settings.FRONTEND_URL}/newsletter/unsubscribe/{subscriber.unsubscribe_token}/'
        
        html_content += f"""
        <div style="margin-top: 40px; padding: 20px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #6c757d;">
            <p>You received this email because you subscribed to Neurolancer updates.</p>
            <p><a href="{unsubscribe_link}" style="color: #6c757d;">Unsubscribe</a> | 
               <a href="{settings.FRONTEND_URL}" style="color: #6c757d;">Visit Neurolancer</a></p>
        </div>
        {tracking_pixel}
        """
        
        # Send email
        send_mail(
            subject=subject,
            message=plain_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[subscriber.email],
            html_message=html_content,
            fail_silently=False,
        )
        
        # Update send log
        send_log.status = 'sent'
        send_log.sent_at = timezone.now()
        send_log.save()
        
        # Update subscriber
        subscriber.last_email_sent = timezone.now()
        subscriber.save()
        
        return True, None
        
    except Exception as e:
        # Update send log with error
        if 'send_log' in locals():
            send_log.status = 'failed'
            send_log.error_message = str(e)
            send_log.save()
        
        return False, str(e)

def send_newsletter_verification_email(subscriber):
    """Send email verification to newsletter subscriber"""
    verification_url = f"{settings.FRONTEND_URL}/newsletter/verify/{subscriber.verification_token}/"
    
    subject = 'Confirm your Neurolancer newsletter subscription'
    message = f'''
Hi {subscriber.first_name or 'there'},

Thank you for subscribing to the Neurolancer newsletter! Please confirm your subscription by clicking the link below:

{verification_url}

If you didn't subscribe to our newsletter, please ignore this email.

Best regards,
The Neurolancer Team
    '''
    
    html_message = f'''
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Confirm Your Newsletter Subscription</h2>
        <p>Hi {subscriber.first_name or 'there'},</p>
        <p>Thank you for subscribing to the Neurolancer newsletter! Please confirm your subscription by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Confirm Subscription
            </a>
        </div>
        <p>If you didn't subscribe to our newsletter, please ignore this email.</p>
        <p>Best regards,<br>The Neurolancer Team</p>
    </div>
    '''
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[subscriber.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        subscriber.verification_sent_at = timezone.now()
        subscriber.save()
        
        return True
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        return False

# Newsletter Subscription Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def subscribe_newsletter(request):
    """Subscribe to newsletter"""
    serializer = NewsletterSubscriptionSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        # Check if already subscribed
        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={
                'first_name': serializer.validated_data.get('first_name', ''),
                'last_name': serializer.validated_data.get('last_name', ''),
                'interests': serializer.validated_data.get('interests', ''),
                'user_type_preference': serializer.validated_data.get('user_type_preference', 'all'),
                'source': serializer.validated_data.get('source', 'website'),
                'status': 'active',
                'email_verified': True  # Auto-verify for website subscriptions
            }
        )
        
        if not created and subscriber.status == 'active':
            return Response({
                'message': 'You are already subscribed to our newsletter!',
                'already_subscribed': True
            })
        
        # Reactivate if previously unsubscribed
        if not created and subscriber.status != 'active':
            subscriber.status = 'active'
            subscriber.unsubscribed_at = None
            subscriber.email_verified = True  # Auto-verify on reactivation
            subscriber.save()
        
        # Link to user if authenticated
        if request.user.is_authenticated:
            subscriber.user = request.user
            if not subscriber.first_name and request.user.first_name:
                subscriber.first_name = request.user.first_name
            if not subscriber.last_name and request.user.last_name:
                subscriber.last_name = request.user.last_name
            subscriber.save()
        
        # Send verification email
        verification_sent = send_newsletter_verification_email(subscriber)
        
        return Response({
            'message': 'Successfully subscribed! Please check your email to confirm your subscription.',
            'verification_sent': verification_sent,
            'subscriber_id': subscriber.id
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_newsletter_subscription(request, token):
    """Verify newsletter subscription"""
    try:
        subscriber = NewsletterSubscriber.objects.get(verification_token=token)
        
        if subscriber.email_verified:
            return Response({
                'message': 'Your subscription is already verified!',
                'already_verified': True
            })
        
        subscriber.email_verified = True
        subscriber.verification_token = ''
        subscriber.save()
        
        return Response({
            'message': 'Your newsletter subscription has been verified successfully!',
            'verified': True
        })
        
    except NewsletterSubscriber.DoesNotExist:
        return Response({
            'error': 'Invalid verification token'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def unsubscribe_newsletter(request, token):
    """Unsubscribe from newsletter"""
    try:
        subscriber = NewsletterSubscriber.objects.get(unsubscribe_token=token)
        
        if subscriber.status == 'unsubscribed':
            return Response({
                'message': 'You are already unsubscribed from our newsletter.',
                'already_unsubscribed': True
            })
        
        subscriber.status = 'unsubscribed'
        subscriber.unsubscribed_at = timezone.now()
        subscriber.save()
        
        return Response({
            'message': 'You have been successfully unsubscribed from our newsletter.',
            'unsubscribed': True
        })
        
    except NewsletterSubscriber.DoesNotExist:
        return Response({
            'error': 'Invalid unsubscribe token'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def track_newsletter_open(request, tracking_id):
    """Track newsletter open"""
    try:
        send_log = NewsletterSendLog.objects.get(tracking_id=tracking_id)
        
        if send_log.status == 'sent':
            send_log.status = 'opened'
            send_log.opened_at = timezone.now()
            send_log.save()
            
            # Update newsletter stats
            newsletter = send_log.newsletter
            newsletter.total_opened += 1
            newsletter.save()
            
            # Update subscriber stats
            subscriber = send_log.subscriber
            subscriber.email_open_count += 1
            subscriber.save()
        
        # Return 1x1 transparent pixel
        from django.http import HttpResponse
        pixel = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00\x21\xF9\x04\x01\x00\x00\x00\x00\x2C\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x04\x01\x00\x3B'
        return HttpResponse(pixel, content_type='image/gif')
        
    except NewsletterSendLog.DoesNotExist:
        from django.http import HttpResponse
        pixel = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00\x21\xF9\x04\x01\x00\x00\x00\x00\x2C\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x04\x01\x00\x3B'
        return HttpResponse(pixel, content_type='image/gif')

# Admin Newsletter Management Views
class IsAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)

class NewsletterSubscriberListView(generics.ListAPIView):
    serializer_class = NewsletterSubscriberSerializer
    permission_classes = [IsAdminPermission]
    
    def get_queryset(self):
        queryset = NewsletterSubscriber.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-subscribed_at')

class NewsletterListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminPermission]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return NewsletterListSerializer
        return NewsletterSerializer
    
    def get_queryset(self):
        return Newsletter.objects.all().order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class NewsletterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Newsletter.objects.all()
    serializer_class = NewsletterSerializer
    permission_classes = [IsAdminPermission]

@api_view(['POST'])
@permission_classes([IsAdminPermission])
def send_newsletter(request, newsletter_id):
    """Send newsletter to subscribers"""
    try:
        newsletter = Newsletter.objects.get(id=newsletter_id)
        
        if newsletter.status != 'draft':
            return Response({
                'error': 'Only draft newsletters can be sent'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get target subscribers
        subscribers = NewsletterSubscriber.objects.filter(
            status='active'
        )
        # Note: Removed email_verified=True filter to include all active subscribers
        
        # Apply audience filters
        if newsletter.target_audience == 'clients':
            subscribers = subscribers.filter(
                Q(user_type_preference='client') | Q(user_type_preference='all')
            )
        elif newsletter.target_audience == 'freelancers':
            subscribers = subscribers.filter(
                Q(user_type_preference='freelancer') | Q(user_type_preference='all')
            )
        elif newsletter.target_audience == 'new_users':
            thirty_days_ago = timezone.now() - timedelta(days=30)
            subscribers = subscribers.filter(subscribed_at__gte=thirty_days_ago)
        
        # Update newsletter status
        newsletter.status = 'sending'
        newsletter.total_recipients = subscribers.count()
        newsletter.save()
        
        # Send emails
        sent_count = 0
        failed_count = 0
        
        for subscriber in subscribers:
            success, error = send_newsletter_email(subscriber, newsletter)
            if success:
                sent_count += 1
            else:
                failed_count += 1
        
        # Update newsletter final status
        newsletter.status = 'sent'
        newsletter.sent_at = timezone.now()
        newsletter.total_sent = sent_count
        newsletter.save()
        
        return Response({
            'message': f'Newsletter sent successfully to {sent_count} subscribers',
            'sent_count': sent_count,
            'failed_count': failed_count,
            'total_recipients': newsletter.total_recipients
        })
        
    except Newsletter.DoesNotExist:
        return Response({
            'error': 'Newsletter not found'
        }, status=status.HTTP_404_NOT_FOUND)

class NewsletterTemplateListCreateView(generics.ListCreateAPIView):
    queryset = NewsletterTemplate.objects.filter(is_active=True)
    serializer_class = NewsletterTemplateSerializer
    permission_classes = [IsAdminPermission]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class NewsletterContentListCreateView(generics.ListCreateAPIView):
    queryset = NewsletterContent.objects.filter(is_published=True)
    serializer_class = NewsletterContentSerializer
    permission_classes = [IsAdminPermission]
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

@api_view(['GET'])
@permission_classes([IsAdminPermission])
def newsletter_analytics(request):
    """Get newsletter analytics dashboard"""
    # Overall stats
    total_subscribers = NewsletterSubscriber.objects.filter(status='active').count()
    total_newsletters = Newsletter.objects.filter(status='sent').count()
    
    # Recent performance
    recent_newsletters = Newsletter.objects.filter(
        status='sent',
        sent_at__gte=timezone.now() - timedelta(days=30)
    )
    
    avg_open_rate = 0
    avg_click_rate = 0
    if recent_newsletters.exists():
        total_delivered = sum(n.total_delivered for n in recent_newsletters)
        total_opened = sum(n.total_opened for n in recent_newsletters)
        total_clicked = sum(n.total_clicked for n in recent_newsletters)
        
        if total_delivered > 0:
            avg_open_rate = (total_opened / total_delivered) * 100
            avg_click_rate = (total_clicked / total_delivered) * 100
    
    # Growth stats
    thirty_days_ago = timezone.now() - timedelta(days=30)
    new_subscribers = NewsletterSubscriber.objects.filter(
        subscribed_at__gte=thirty_days_ago
    ).count()
    
    return Response({
        'total_subscribers': total_subscribers,
        'total_newsletters': total_newsletters,
        'new_subscribers_30d': new_subscribers,
        'avg_open_rate': round(avg_open_rate, 2),
        'avg_click_rate': round(avg_click_rate, 2),
        'recent_newsletters': NewsletterListSerializer(recent_newsletters[:5], many=True).data
    })