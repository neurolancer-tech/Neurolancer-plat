from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .referral_models import ReferralSettings, ReferralCode, Referral, ReferralEarning, ReferralWithdrawal
from .referral_service import ReferralService
from .models import UserProfile, Transaction
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_referral_info(request):
    """Get user's referral information"""
    try:
        # Create referral code if doesn't exist
        referral_code = ReferralService.create_referral_code(request.user)
        
        if not referral_code:
            return Response({'error': 'Failed to create referral code'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get referral stats
        stats = ReferralService.get_referral_stats(request.user)
        
        if not stats:
            return Response({'error': 'Failed to get referral stats'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get settings for display
        settings = ReferralSettings.get_settings()
        
        return Response({
            'status': 'success',
            'data': {
                **stats,
                'settings': {
                    'signup_bonus_amount': float(settings.signup_bonus_amount),
                    'earnings_percentage': float(settings.earnings_percentage),
                    'signup_bonus_enabled': settings.signup_bonus_enabled,
                    'earnings_percentage_enabled': settings.earnings_percentage_enabled,
                    'min_payout_amount': float(settings.min_payout_amount)
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting referral info: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_referral_earnings(request):
    """Get user's referral earnings history"""
    try:
        earnings = ReferralEarning.objects.filter(referrer=request.user).order_by('-created_at')
        
        earnings_data = []
        for earning in earnings:
            earnings_data.append({
                'id': earning.id,
                'type': earning.earning_type,
                'amount': float(earning.amount),
                'status': earning.status,
                'referred_user': earning.referred_user.username,
                'description': earning.description,
                'created_at': earning.created_at.isoformat(),
                'source_amount': float(earning.source_amount) if earning.source_amount else None,
                'percentage_rate': float(earning.percentage_rate) if earning.percentage_rate else None
            })
        
        return Response({
            'status': 'success',
            'data': earnings_data
        })
        
    except Exception as e:
        logger.error(f"Error getting referral earnings: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_referral_withdrawal(request):
    """Request withdrawal of referral earnings"""
    try:
        amount = request.data.get('amount')
        withdrawal_method = request.data.get('method', 'balance')
        account_details = request.data.get('account_details', {})
        
        if not amount:
            return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        amount = float(amount)
        settings = ReferralSettings.get_settings()
        
        # Check minimum payout amount
        if amount < float(settings.min_payout_amount):
            return Response({
                'error': f'Minimum withdrawal amount is ${settings.min_payout_amount}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user's referral code and check available earnings
        referral_code = ReferralCode.objects.filter(user=request.user).first()
        if not referral_code or referral_code.pending_earnings < amount:
            return Response({'error': 'Insufficient referral earnings'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create withdrawal request
        withdrawal = ReferralWithdrawal.objects.create(
            user=request.user,
            amount=amount,
            withdrawal_method=withdrawal_method,
            account_details=account_details
        )
        
        # Update referral code balances
        referral_code.pending_earnings -= amount
        referral_code.save()
        
        return Response({
            'status': 'success',
            'message': 'Withdrawal request submitted successfully',
            'withdrawal_id': withdrawal.id
        })
        
    except Exception as e:
        logger.error(f"Error requesting referral withdrawal: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_referral_withdrawals(request):
    """Get user's referral withdrawal history"""
    try:
        withdrawals = ReferralWithdrawal.objects.filter(user=request.user).order_by('-created_at')
        
        withdrawals_data = []
        for withdrawal in withdrawals:
            withdrawals_data.append({
                'id': withdrawal.id,
                'amount': float(withdrawal.amount),
                'method': withdrawal.withdrawal_method,
                'status': withdrawal.status,
                'created_at': withdrawal.created_at.isoformat(),
                'processed_at': withdrawal.processed_at.isoformat() if withdrawal.processed_at else None
            })
        
        return Response({
            'status': 'success',
            'data': withdrawals_data
        })
        
    except Exception as e:
        logger.error(f"Error getting referral withdrawals: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Admin Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_referral_settings(request):
    """Get or update referral system settings"""
    try:
        settings = ReferralSettings.get_settings()
        
        if request.method == 'GET':
            return Response({
                'status': 'success',
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
                    'updated_at': settings.updated_at.isoformat()
                }
            })
        
        elif request.method == 'POST':
            # Update settings
            data = request.data
            
            settings.is_active = data.get('is_active', settings.is_active)
            settings.signup_bonus_enabled = data.get('signup_bonus_enabled', settings.signup_bonus_enabled)
            settings.earnings_percentage_enabled = data.get('earnings_percentage_enabled', settings.earnings_percentage_enabled)
            settings.signup_bonus_amount = data.get('signup_bonus_amount', settings.signup_bonus_amount)
            settings.earnings_percentage = data.get('earnings_percentage', settings.earnings_percentage)
            settings.max_referrals_per_user = data.get('max_referrals_per_user', settings.max_referrals_per_user)
            settings.min_payout_amount = data.get('min_payout_amount', settings.min_payout_amount)
            settings.earnings_duration_days = data.get('earnings_duration_days', settings.earnings_duration_days)
            settings.require_email_verification = data.get('require_email_verification', settings.require_email_verification)
            settings.require_first_purchase = data.get('require_first_purchase', settings.require_first_purchase)
            settings.min_account_age_hours = data.get('min_account_age_hours', settings.min_account_age_hours)
            settings.updated_by = request.user
            
            settings.save()
            
            return Response({
                'status': 'success',
                'message': 'Referral settings updated successfully'
            })
        
    except Exception as e:
        logger.error(f"Error managing referral settings: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_referral_stats(request):
    """Get referral system statistics for admin"""
    try:
        # Overall stats
        total_referrals = Referral.objects.count()
        verified_referrals = Referral.objects.filter(status='verified').count()
        total_earnings_paid = ReferralEarning.objects.filter(status='approved').aggregate(
            total=Sum('amount'))['total'] or 0
        
        # Top referrers
        top_referrers = ReferralCode.objects.filter(total_signups__gt=0).order_by('-total_signups')[:10]
        top_referrers_data = []
        for code in top_referrers:
            top_referrers_data.append({
                'username': code.user.username,
                'total_signups': code.total_signups,
                'total_earnings': float(code.total_earnings),
                'code': code.code
            })
        
        # Recent activity
        recent_referrals = Referral.objects.order_by('-signed_up_at')[:20]
        recent_activity = []
        for referral in recent_referrals:
            recent_activity.append({
                'referrer': referral.referrer.username,
                'referred_user': referral.referred_user.username,
                'status': referral.status,
                'signed_up_at': referral.signed_up_at.isoformat(),
                'bonus_paid': referral.signup_bonus_paid
            })
        
        # Pending withdrawals
        pending_withdrawals = ReferralWithdrawal.objects.filter(status='pending').count()
        
        return Response({
            'status': 'success',
            'data': {
                'total_referrals': total_referrals,
                'verified_referrals': verified_referrals,
                'total_earnings_paid': float(total_earnings_paid),
                'pending_withdrawals': pending_withdrawals,
                'top_referrers': top_referrers_data,
                'recent_activity': recent_activity
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting admin referral stats: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_referral_withdrawals(request):
    """Get all referral withdrawal requests for admin"""
    try:
        withdrawals = ReferralWithdrawal.objects.all().order_by('-created_at')
        
        withdrawals_data = []
        for withdrawal in withdrawals:
            withdrawals_data.append({
                'id': withdrawal.id,
                'user': withdrawal.user.username,
                'amount': float(withdrawal.amount),
                'method': withdrawal.withdrawal_method,
                'status': withdrawal.status,
                'account_details': withdrawal.account_details,
                'created_at': withdrawal.created_at.isoformat(),
                'processed_at': withdrawal.processed_at.isoformat() if withdrawal.processed_at else None,
                'processed_by': withdrawal.processed_by.username if withdrawal.processed_by else None
            })
        
        return Response({
            'status': 'success',
            'data': withdrawals_data
        })
        
    except Exception as e:
        logger.error(f"Error getting admin referral withdrawals: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_process_withdrawal(request, withdrawal_id):
    """Process referral withdrawal request"""
    try:
        withdrawal = ReferralWithdrawal.objects.get(id=withdrawal_id)
        action = request.data.get('action')  # 'approve' or 'reject'
        
        if action == 'approve':
            if withdrawal.withdrawal_method == 'balance':
                # Add to user's account balance
                user_profile, created = UserProfile.objects.get_or_create(user=withdrawal.user)
                user_profile.available_balance += withdrawal.amount
                user_profile.save()
                
                # Update referral code
                referral_code = ReferralCode.objects.get(user=withdrawal.user)
                referral_code.withdrawn_earnings += withdrawal.amount
                referral_code.save()
                
                withdrawal.status = 'completed'
            else:
                withdrawal.status = 'processing'  # Manual processing required
            
            withdrawal.processed_by = request.user
            withdrawal.processed_at = timezone.now()
            withdrawal.save()
            
            return Response({
                'status': 'success',
                'message': 'Withdrawal processed successfully'
            })
        
        elif action == 'reject':
            # Return amount to pending earnings
            referral_code = ReferralCode.objects.get(user=withdrawal.user)
            referral_code.pending_earnings += withdrawal.amount
            referral_code.save()
            
            withdrawal.status = 'cancelled'
            withdrawal.processed_by = request.user
            withdrawal.processed_at = timezone.now()
            withdrawal.save()
            
            return Response({
                'status': 'success',
                'message': 'Withdrawal rejected successfully'
            })
        
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
    except ReferralWithdrawal.DoesNotExist:
        return Response({'error': 'Withdrawal not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error processing withdrawal: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)