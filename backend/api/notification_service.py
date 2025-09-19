from django.contrib.auth.models import User
from .models import Notification

class NotificationService:
    """Service for creating and managing notifications"""
    
    @staticmethod
    def create_notification(user, title, message, notification_type='system', action_url='', related_object_id=None):
        """Create a notification for a user"""
        try:
            notification = Notification.objects.create(
                user=user,
                title=title,
                message=message,
                notification_type=notification_type,
                action_url=action_url,
                related_object_id=related_object_id
            )
            return notification
        except Exception as e:
            print(f"Error creating notification: {e}")
            return None
    
    @staticmethod
    def send_new_user_setup(user):
        """Send welcome notifications and email for new users"""
        try:
            # Create welcome notification
            NotificationService.create_notification(
                user=user,
                title="Welcome to Neurolancer!",
                message="Welcome to the AI freelance marketplace. Complete your profile to get started.",
                notification_type='system',
                action_url='/profile'
            )
            
            # Send welcome email
            from .email_service import EmailService
            EmailService.send_welcome_email(user)
            
        except Exception as e:
            print(f"Error sending welcome setup: {e}")
    
    @staticmethod
    def send_verification_notification(user, status, message=''):
        """Send verification status notifications to users"""
        try:
            if status == 'submitted':
                title = "Verification Request Submitted"
                msg = "Your verification request has been submitted and is under review. We'll notify you once it's processed."
                action_url = '/profile/verification'
            elif status == 'approved' or status == 'verified':
                title = "Verification Approved ✅"
                msg = "Congratulations! Your verification request has been approved. You now have a verified badge on your profile."
                action_url = '/profile'
            elif status == 'rejected':
                title = "Verification Request Rejected"
                msg = f"Your verification request has been rejected. {message if message else 'Please review the requirements and submit a new request.'}"
                action_url = '/profile/verification'
            elif status == 'pending_review':
                title = "Verification Under Review"
                msg = "Your verification request is currently being reviewed by our team. We'll update you soon."
                action_url = '/profile/verification'
            elif status == 'cancelled':
                title = "Verification Request Cancelled"
                msg = "Your verification request has been cancelled. You can submit a new request anytime."
                action_url = '/profile/verification'
            elif status == 'invalid':
                title = "Verification Request Invalid"
                msg = f"Your verification request was marked as invalid. {message if message else 'Please check the requirements and submit a new request.'}"
                action_url = '/profile/verification'
            else:
                return
            
            NotificationService.create_notification(
                user=user,
                title=title,
                message=msg,
                notification_type='verification',
                action_url=action_url
            )
            
        except Exception as e:
            print(f"Error sending verification notification: {e}")