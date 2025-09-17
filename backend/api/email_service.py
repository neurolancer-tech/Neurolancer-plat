from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending various types of emails"""
    
    @staticmethod
    def send_welcome_email(user):
        """Send welcome email to new users"""
        try:
            context = {
                'user_name': user.get_full_name() or user.username,
                'user_email': user.email,
            }
            
            html_message = render_to_string('emails/welcome_email.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject='Welcome to Neurolancer - Your AI Freelance Journey Starts Here! 🚀',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Welcome email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {e}")
            return False
    
    @staticmethod
    def send_verification_email(user, verification_url):
        """Send email verification email"""
        try:
            context = {
                'user_name': user.get_full_name() or user.username,
                'verification_url': verification_url,
            }
            
            html_message = render_to_string('emails/verify_email.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject='Verify your Neurolancer account',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Verification email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}: {e}")
            return False