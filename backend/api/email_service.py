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

    @staticmethod
    def send_referral_bonus_email(referrer, referred_user, amount):
        """Notify referrer that they earned a signup bonus"""
        try:
            context = {
                'referrer_name': referrer.get_full_name() or referrer.username,
                'referred_username': referred_user.username,
                'amount': amount,
            }
            html_message = render_to_string('emails/referral_bonus.html', context)
            plain_message = strip_tags(html_message)
            send_mail(
                subject=f'You earned a referral bonus: ${amount}',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[referrer.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Referral bonus email sent to {referrer.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send referral bonus email to {referrer.email}: {e}")
            return False

    @staticmethod
    def send_referral_verified_email(referrer, referred_user):
        """Notify referrer that a referral has been verified"""
        try:
            context = {
                'referrer_name': referrer.get_full_name() or referrer.username,
                'referred_username': referred_user.username,
            }
            html_message = render_to_string('emails/referral_verified.html', context)
            plain_message = strip_tags(html_message)
            send_mail(
                subject=f'Referral verified: {referred_user.username}',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[referrer.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Referral verified email sent to {referrer.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send referral verified email to {referrer.email}: {e}")
            return False

    @staticmethod
    def send_referral_percentage_earning_email(referrer, referred_user, amount, percentage_rate, source_amount):
        """Notify referrer they earned a percentage from referred user's transaction"""
        try:
            context = {
                'referrer_name': referrer.get_full_name() or referrer.username,
                'referred_username': referred_user.username,
                'amount': amount,
                'percentage_rate': percentage_rate,
                'source_amount': source_amount,
            }
            html_message = render_to_string('emails/referral_percentage_earning.html', context)
            plain_message = strip_tags(html_message)
            send_mail(
                subject=f'You earned ${amount} from your referral',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[referrer.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Referral percentage earning email sent to {referrer.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send referral percentage email to {referrer.email}: {e}")
            return False

    @staticmethod
    def send_referral_withdrawal_requested_email(user, amount, method):
        """Notify user their referral withdrawal was requested"""
        try:
            context = {
                'user_name': user.get_full_name() or user.username,
                'amount': amount,
                'method': method,
            }
            html_message = render_to_string('emails/referral_withdrawal_requested.html', context)
            plain_message = strip_tags(html_message)
            send_mail(
                subject=f'Referral withdrawal requested: ${amount}',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Referral withdrawal requested email sent to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send referral withdrawal requested email to {user.email}: {e}")
            return False

    @staticmethod
    def send_referral_withdrawal_processed_email(user, amount, method, status, payment_reference=None):
        """Notify user their referral withdrawal was processed/updated"""
        try:
            context = {
                'user_name': user.get_full_name() or user.username,
                'amount': amount,
                'method': method,
                'status': status,
                'payment_reference': payment_reference,
            }
            html_message = render_to_string('emails/referral_withdrawal_processed.html', context)
            plain_message = strip_tags(html_message)
            subject_status = 'completed' if status == 'completed' else ('failed' if status == 'failed' else status)
            send_mail(
                subject=f'Referral withdrawal {subject_status}: ${amount}',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Referral withdrawal processed email sent to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send referral withdrawal processed email to {user.email}: {e}")
            return False
