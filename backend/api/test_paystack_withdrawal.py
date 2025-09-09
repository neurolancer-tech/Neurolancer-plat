from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import UserProfile, Withdrawal
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_paystack_withdraw(request):
    """Test Paystack withdrawal without actual API calls"""
    try:
        amount = float(request.data.get('amount', 0))
        bank_code = request.data.get('bank_code')
        account_number = request.data.get('account_number')
        account_name = request.data.get('account_name')
        
        if not all([amount, bank_code, account_number, account_name]):
            return Response({
                'error': 'Amount, bank code, account number, and account name are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check user's available balance
        user_profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        if user_profile.available_balance < amount:
            return Response({
                'error': f'Insufficient balance. Available: ${user_profile.available_balance}, Required: ${amount}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mock successful Paystack response for testing
        mock_reference = f'test_paystack_{request.user.id}_{int(__import__("time").time())}'
        mock_transfer_code = f'TRF_{mock_reference}'
        
        # Deduct from available balance
        user_profile.available_balance -= Decimal(str(amount))
        user_profile.save()
        
        # Create withdrawal record
        withdrawal = Withdrawal.objects.create(
            user=request.user,
            amount=amount,
            bank_name=f'Test Bank (Code: {bank_code})',
            account_number=account_number,
            status='processing',
            reference=mock_reference,
            paystack_recipient_code=f'RCP_test_{bank_code}',
            paystack_transfer_code=mock_transfer_code
        )
        
        return Response({
            'status': 'success',
            'message': 'Test Paystack withdrawal initiated successfully',
            'data': {
                'withdrawal_id': withdrawal.id,
                'reference': mock_reference,
                'resolved_account_name': account_name,
                'amount': amount,
                'transfer_code': mock_transfer_code,
                'status': 'processing',
                'test_mode': True
            }
        })
        
    except Exception as e:
        logger.error(f'Test Paystack withdrawal error: {e}')
        import traceback
        traceback.print_exc()
        return Response({
            'error': f'Withdrawal error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)