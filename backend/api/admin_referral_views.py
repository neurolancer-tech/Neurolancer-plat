from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .referral_models import ReferralSettings, ReferralCode, Referral, ReferralEarning, ReferralWithdrawal
from .referral_service import ReferralService
from .permissions import IsAdminUser
import logging

logger = logging.getLogger(__name__)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_referral_settings(request):
    """Get or update referral system settings"""
    try:
        settings = ReferralSettings.get_settings()
        
        if request.method == 'GET':
            return Response({
                'success': True,
                'data': {
                    'is_active': settings.is_active,
                    'signup_bonus_enabled': settings.signup_bonus_enabled,
                    'earnings_percentage_enabled': settings.earnings_percentage_enabled,
                    'signup_bonus_amount': float(settings.signup_bonus_amount),
                    'earnings_percentage': float(settings.earnings_percentage),
                    'max_referrals_per_user': settings.max_referrals_per_user,
                    'min_payout_amount': float(settings.min_payout_amount),
                    'earnings_duration_days': settings.earnings_duration_days,
                    'require_email_verification': settings.require_email_verification,
                    'require_first_purchase': settings.require_first_purchase,
                    'min_account_age_hours': settings.min_account_age_hours,
                }
            })
        
        elif request.method == 'PATCH':
            # Update settings
            data = request.data
            
            # Update fields if provided
            if 'is_active' in data:
                settings.is_active = data['is_active']
            if 'signup_bonus_enabled' in data:
                settings.signup_bonus_enabled = data['signup_bonus_enabled']
            if 'earnings_percentage_enabled' in data:
                settings.earnings_percentage_enabled = data['earnings_percentage_enabled']
            if 'signup_bonus_amount' in data:
                settings.signup_bonus_amount = data['signup_bonus_amount']
            if 'earnings_percentage' in data:
                settings.earnings_percentage = data['earnings_percentage']
            if 'max_referrals_per_user' in data:
                settings.max_referrals_per_user = data['max_referrals_per_user']
            if 'min_payout_amount' in data:
                settings.min_payout_amount = data['min_payout_amount']
            if 'earnings_duration_days' in data:
                settings.earnings_duration_days = data['earnings_duration_days']
            if 'require_email_verification' in data:
                settings.require_email_verification = data['require_email_verification']
            if 'require_first_purchase' in data:
                settings.require_first_purchase = data['require_first_purchase']
            if 'min_account_age_hours' in data:
                settings.min_account_age_hours = data['min_account_age_hours']
            
            settings.updated_by = request.user
            settings.save()
            
            return Response({
                'success': True,
                'message': 'Settings updated successfully',
                'data': {
                    'is_active': settings.is_active,
                    'signup_bonus_enabled': settings.signup_bonus_enabled,
                    'earnings_percentage_enabled': settings.earnings_percentage_enabled,
                    'signup_bonus_amount': float(settings.signup_bonus_amount),
                    'earnings_percentage': float(settings.earnings_percentage),
                    'max_referrals_per_user': settings.max_referrals_per_user,
                    'min_payout_amount': float(settings.min_payout_amount),
                    'earnings_duration_days': settings.earnings_duration_days,
                    'require_email_verification': settings.require_email_verification,
                    'require_first_purchase': settings.require_first_purchase,
                    'min_account_age_hours': settings.min_account_age_hours,
                }
            })
            
    except Exception as e:
        logger.error(f"Error in admin_referral_settings: {e}")
        return Response({
            'success': False,
            'error': 'Failed to process referral settings'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_referral_stats(request):
    """Get referral system statistics"""
    try:
        # Get overall stats
        total_referrals = Referral.objects.count()
        total_earnings_paid = ReferralEarning.objects.filter(
            status='approved'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        active_referrers = ReferralCode.objects.filter(
            is_active=True,
            total_signups__gt=0
        ).count()
        
        pending_withdrawals = ReferralWithdrawal.objects.filter(
            status='pending'
        ).count()
        
        # Get recent referrals
        recent_referrals = Referral.objects.select_related(
            'referrer', 'referred_user'
        ).order_by('-signed_up_at')[:10]
        
        recent_referrals_data = []
        for referral in recent_referrals:
            recent_referrals_data.append({
                'id': referral.id,
                'referrer_username': referral.referrer.username,
                'referred_username': referral.referred_user.username,
                'status': referral.status,
                'signup_bonus_amount': float(referral.signup_bonus_amount),
                'created_at': referral.signed_up_at.isoformat()
            })
        
        return Response({
            'success': True,
            'data': {
                'total_referrals': total_referrals,
                'total_earnings_paid': float(total_earnings_paid),
                'active_referrers': active_referrers,
                'pending_withdrawals': pending_withdrawals,
                'recent_referrals': recent_referrals_data
            }
        })
        
    except Exception as e:
        logger.error(f"Error in admin_referral_stats: {e}")
        return Response({
            'success': False,
            'error': 'Failed to get referral statistics'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_referral_users(request):
    """Get all users with referral codes"""
    try:
        referral_codes = ReferralCode.objects.select_related('user').all()
        
        users_data = []
        for ref_code in referral_codes:
            users_data.append({
                'id': ref_code.user.id,
                'username': ref_code.user.username,
                'email': ref_code.user.email,
                'referral_code': ref_code.code,
                'total_referrals': ref_code.total_signups,
                'total_earnings': float(ref_code.total_earnings),
                'pending_earnings': float(ref_code.pending_earnings),
                'withdrawn_earnings': float(ref_code.withdrawn_earnings),
                'is_active': ref_code.is_active,
                'created_at': ref_code.created_at.isoformat()
            })
        
        return Response({
            'success': True,
            'data': users_data
        })
        
    except Exception as e:
        logger.error(f"Error in admin_referral_users: {e}")
        return Response({
            'success': False,
            'error': 'Failed to get referral users'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_update_referral_user(request, user_id):
    """Update referral user status"""
    try:
        user = User.objects.get(id=user_id)
        referral_code = ReferralCode.objects.get(user=user)
        
        data = request.data
        if 'is_active' in data:
            referral_code.is_active = data['is_active']
            referral_code.save()
        
        return Response({
            'success': True,
            'message': f"User {user.username} referral status updated"
        })
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except ReferralCode.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Referral code not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in admin_update_referral_user: {e}")
        return Response({
            'success': False,
            'error': 'Failed to update user'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_referral_withdrawals(request):
    """Get all referral withdrawals"""
    try:
        withdrawals = ReferralWithdrawal.objects.select_related('user').order_by('-created_at')
        
        withdrawals_data = []
        for withdrawal in withdrawals:
            withdrawals_data.append({
                'id': withdrawal.id,
                'user_id': withdrawal.user.id,
                'username': withdrawal.user.username,
                'email': withdrawal.user.email,
                'amount': float(withdrawal.amount),
                'withdrawal_method': withdrawal.withdrawal_method,
                'status': withdrawal.status,
                'created_at': withdrawal.created_at.isoformat(),
                'processed_at': withdrawal.processed_at.isoformat() if withdrawal.processed_at else None,
                'payment_reference': withdrawal.payment_reference
            })
        
        return Response({
            'success': True,
            'data': withdrawals_data
        })
        
    except Exception as e:
        logger.error(f"Error in admin_referral_withdrawals: {e}")
        return Response({
            'success': False,
            'error': 'Failed to get withdrawals'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_process_withdrawal(request, withdrawal_id):
    """Process a referral withdrawal"""
    try:
        withdrawal = ReferralWithdrawal.objects.get(id=withdrawal_id)
        data = request.data
        
        if 'status' in data:
            withdrawal.status = data['status']
            
        if 'payment_reference' in data:
            withdrawal.payment_reference = data['payment_reference']
            
        if withdrawal.status in ['completed', 'failed']:
            withdrawal.processed_at = timezone.now()
            withdrawal.processed_by = request.user
            
            # If completed, update user's referral code
            if withdrawal.status == 'completed':
                referral_code = ReferralCode.objects.get(user=withdrawal.user)
                referral_code.pending_earnings -= withdrawal.amount
                referral_code.withdrawn_earnings += withdrawal.amount
                referral_code.save()
        
        withdrawal.save()
        
        return Response({
            'success': True,
            'message': f"Withdrawal {withdrawal.id} updated to {withdrawal.status}"
        })
        
    except ReferralWithdrawal.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Withdrawal not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in admin_process_withdrawal: {e}")
        return Response({
            'success': False,
            'error': 'Failed to process withdrawal'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_award_bonus(request):
    """Award special bonus to user"""
    try:
        data = request.data
        user_id = data.get('user_id')
        amount = data.get('amount')
        description = data.get('description', 'Admin bonus')
        
        if not user_id or not amount:
            return Response({
                'success': False,
                'error': 'User ID and amount are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(id=user_id)
        
        # Create earning record
        earning = ReferralEarning.objects.create(
            referrer=user,
            referred_user=user,  # Self-referral for admin bonus
            referral=None,  # No specific referral
            earning_type='bonus',
            amount=amount,
            status='approved',
            description=description
        )
        
        # Add to user's balance
        ReferralService.add_to_referral_balance(user, amount)
        
        # Update referral code stats
        referral_code, created = ReferralCode.objects.get_or_create(user=user)
        referral_code.total_earnings += amount
        referral_code.pending_earnings += amount
        referral_code.save()
        
        return Response({
            'success': True,
            'message': f"Bonus of ${amount} awarded to {user.username}"
        })
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in admin_award_bonus: {e}")
        return Response({
            'success': False,
            'error': 'Failed to award bonus'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)