from django.contrib.auth.models import User
from django.utils import timezone
from django.db import models
from decimal import Decimal
from .referral_models import ReferralSettings, ReferralCode, Referral, ReferralEarning
from .models import Transaction, UserProfile
import logging

logger = logging.getLogger(__name__)

class ReferralService:
    """Service for handling referral system logic"""
    
    @staticmethod
    def create_referral_code(user):
        """Create referral code for user"""
        try:
            code, created = ReferralCode.objects.get_or_create(user=user)
            return code
        except Exception as e:
            logger.error(f"Error creating referral code for {user.username}: {e}")
            return None
    
    @staticmethod
    def process_referral_signup(referred_user, referral_code, ip_address=None, user_agent=None):
        """Process new user signup with referral code"""
        try:
            settings = ReferralSettings.get_settings()
            
            if not settings.is_active:
                return None
            
            # Get referral code object
            try:
                ref_code = ReferralCode.objects.get(code=referral_code, is_active=True)
            except ReferralCode.DoesNotExist:
                logger.warning(f"Invalid referral code: {referral_code}")
                return None
            
            # Prevent self-referral
            if ref_code.user == referred_user:
                logger.warning(f"Self-referral attempt by {referred_user.username}")
                return None
            
            # Check if user already has referral
            if hasattr(referred_user, 'referral_info'):
                logger.warning(f"User {referred_user.username} already has referral")
                return None
            
            # Check referral limits
            if settings.max_referrals_per_user > 0:
                current_referrals = Referral.objects.filter(referrer=ref_code.user).count()
                if current_referrals >= settings.max_referrals_per_user:
                    logger.warning(f"Referral limit exceeded for {ref_code.user.username}")
                    return None
            
            # Create referral record
            referral = Referral.objects.create(
                referrer=ref_code.user,
                referred_user=referred_user,
                referral_code=ref_code,
                ip_address=ip_address,
                user_agent=user_agent or ''
            )
            
            # Update referral code stats
            ref_code.total_signups += 1
            ref_code.save()
            
            logger.info(f"Referral created: {ref_code.user.username} -> {referred_user.username}")
            return referral
            
        except Exception as e:
            logger.error(f"Error processing referral signup: {e}")
            return None
    
    @staticmethod
    def verify_referral(referral):
        """Verify referral and process signup bonus"""
        try:
            settings = ReferralSettings.get_settings()
            
            if not settings.is_active or not settings.signup_bonus_enabled:
                return False
            
            # Check if already verified
            if referral.status != 'pending':
                return False
            
            # Check email verification requirement
            if settings.require_email_verification:
                user_profile = getattr(referral.referred_user, 'userprofile', None)
                if not user_profile or not user_profile.email_verified:
                    return False
            
            # Check account age requirement
            if settings.min_account_age_hours > 0:
                account_age = timezone.now() - referral.signed_up_at
                if account_age.total_seconds() < (settings.min_account_age_hours * 3600):
                    return False
            
            # Process signup bonus
            if not referral.signup_bonus_paid and settings.signup_bonus_amount > 0:
                ReferralService.award_signup_bonus(referral, settings.signup_bonus_amount)
            
            # Update referral status
            referral.status = 'verified'
            referral.verified_at = timezone.now()
            referral.save()
            
            logger.info(f"Referral verified: {referral}")
            return True
            
        except Exception as e:
            logger.error(f"Error verifying referral {referral.id}: {e}")
            return False
    
    @staticmethod
    def award_signup_bonus(referral, amount):
        """Award signup bonus to referrer"""
        try:
            # Create earning record
            earning = ReferralEarning.objects.create(
                referrer=referral.referrer,
                referred_user=referral.referred_user,
                referral=referral,
                earning_type='signup_bonus',
                amount=amount,
                status='approved',
                description=f"Signup bonus for referring {referral.referred_user.username}"
            )
            
            # Update referral record
            referral.signup_bonus_paid = True
            referral.signup_bonus_amount = amount
            referral.save()
            
            # Update referrer's balance
            ReferralService.add_to_referral_balance(referral.referrer, amount)
            
            # Update referral code stats
            referral.referral_code.total_earnings += amount
            referral.referral_code.pending_earnings += amount
            referral.referral_code.save()
            
            # Create notification
            from .notification_service import NotificationService
            NotificationService.create_notification(
                user=referral.referrer,
                title=f"Referral Bonus Earned: ${amount}",
                message=f"You earned ${amount} for referring {referral.referred_user.username}!",
                notification_type='payment',
                action_url='/referrals'
            )
            
            logger.info(f"Signup bonus awarded: ${amount} to {referral.referrer.username}")
            return earning
            
        except Exception as e:
            logger.error(f"Error awarding signup bonus: {e}")
            return None
    
    @staticmethod
    def process_earnings_percentage(referred_user, transaction_amount, transaction_id=None):
        """Process percentage earnings from referred user's transactions"""
        try:
            settings = ReferralSettings.get_settings()
            
            if not settings.is_active or not settings.earnings_percentage_enabled:
                return None
            
            # Check if user was referred
            if not hasattr(referred_user, 'referral_info'):
                return None
            
            referral = referred_user.referral_info
            
            # Check if referral is verified
            if referral.status != 'verified':
                return None
            
            # Check earnings duration
            if settings.earnings_duration_days > 0:
                duration = timezone.now() - referral.verified_at
                if duration.days > settings.earnings_duration_days:
                    return None
            
            # Calculate percentage earning
            percentage = settings.earnings_percentage / 100
            earning_amount = transaction_amount * percentage
            
            if earning_amount <= 0:
                return None
            
            # Create earning record
            earning = ReferralEarning.objects.create(
                referrer=referral.referrer,
                referred_user=referred_user,
                referral=referral,
                earning_type='earnings_percentage',
                amount=earning_amount,
                status='approved',
                source_transaction_id=transaction_id,
                source_amount=transaction_amount,
                percentage_rate=settings.earnings_percentage,
                description=f"{settings.earnings_percentage}% from {referred_user.username}'s ${transaction_amount} transaction"
            )
            
            # Update referrer's balance
            ReferralService.add_to_referral_balance(referral.referrer, earning_amount)
            
            # Update referral code stats
            referral.referral_code.total_earnings += earning_amount
            referral.referral_code.pending_earnings += earning_amount
            referral.referral_code.save()
            
            logger.info(f"Percentage earning: ${earning_amount} to {referral.referrer.username}")
            return earning
            
        except Exception as e:
            logger.error(f"Error processing earnings percentage: {e}")
            return None
    
    @staticmethod
    def add_to_referral_balance(user, amount):
        """Add amount to user's referral balance"""
        try:
            user_profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Add to available balance (referral earnings go directly to available balance)
            user_profile.available_balance += amount
            user_profile.save()
            
            # Create transaction record
            Transaction.objects.create(
                user=user,
                transaction_type='bonus',
                amount=amount,
                description=f"Referral earnings: ${amount}",
                reference=f"referral_{timezone.now().strftime('%Y%m%d%H%M%S')}",
                status='completed'
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding referral balance: {e}")
            return False
    
    @staticmethod
    def get_referral_stats(user):
        """Get referral statistics for user"""
        try:
            referral_code = ReferralCode.objects.filter(user=user).first()
            if not referral_code:
                return None
            
            # Get earnings breakdown
            earnings = ReferralEarning.objects.filter(referrer=user)
            
            stats = {
                'referral_code': referral_code.code,
                'referral_url': referral_code.referral_url,
                'total_referrals': referral_code.total_signups,
                'total_earnings': float(referral_code.total_earnings),
                'pending_earnings': float(referral_code.pending_earnings),
                'withdrawn_earnings': float(referral_code.withdrawn_earnings),
                'signup_bonuses': float(earnings.filter(earning_type='signup_bonus', status='approved').aggregate(
                    total=models.Sum('amount'))['total'] or 0),
                'percentage_earnings': float(earnings.filter(earning_type='earnings_percentage', status='approved').aggregate(
                    total=models.Sum('amount'))['total'] or 0),
                'recent_referrals': []
            }
            
            # Get recent referrals
            recent_referrals = Referral.objects.filter(referrer=user).order_by('-signed_up_at')[:5]
            for referral in recent_referrals:
                stats['recent_referrals'].append({
                    'username': referral.referred_user.username,
                    'status': referral.status,
                    'signed_up_at': referral.signed_up_at.isoformat(),
                    'bonus_paid': referral.signup_bonus_paid,
                    'bonus_amount': float(referral.signup_bonus_amount)
                })
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting referral stats: {e}")
            return None
    
    @staticmethod
    def check_first_purchase(user):
        """Check and process first purchase for referred user"""
        try:
            settings = ReferralSettings.get_settings()
            
            if not settings.require_first_purchase:
                return True
            
            # Check if user was referred
            if not hasattr(user, 'referral_info'):
                return True
            
            referral = user.referral_info
            
            # Check if first purchase already recorded
            if referral.first_purchase_at:
                return True
            
            # Mark first purchase
            referral.first_purchase_at = timezone.now()
            referral.save()
            
            # Verify referral if it was pending first purchase
            if referral.status == 'pending':
                ReferralService.verify_referral(referral)
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking first purchase: {e}")
            return False