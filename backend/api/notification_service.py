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