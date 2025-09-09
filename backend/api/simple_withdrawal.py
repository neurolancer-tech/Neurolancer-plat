from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import UserProfile, Withdrawal
from decimal import Decimal

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simple_withdrawal(request):
    """Simple withdrawal for testing without Paystack API calls"""
    try:
        amount = float(request.data.get('amount', 0))
        withdrawal_method = request.data.get('method', 'bank')
        account_number = request.data.get('account_number')
        account_name = request.data.get('account_name')
        bank_code = request.data.get('bank_code')
        
        if not all([amount, account_number, account_name]):
            return Response({'error': 'Amount, account number, and account name are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check user's available balance
        user_profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        if user_profile.available_balance < amount:
            return Response({
                'error': f'Insufficient balance. Available: ${user_profile.available_balance}, Required: ${amount}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Deduct from available balance
        user_profile.available_balance -= Decimal(str(amount))
        user_profile.save()
        
        # Create withdrawal record (mock - no actual Paystack call)
        withdrawal = Withdrawal.objects.create(
            user=request.user,
            amount=amount,
            bank_name=f'{withdrawal_method.upper()}: {bank_code}',
            account_number=account_number,
            status='processing',
            reference=f'mock_withdrawal_{request.user.id}_{int(__import__("time").time())}'
        )
        
        return Response({
            'status': 'success',
            'message': f'Mock withdrawal to {withdrawal_method.upper()} initiated successfully',
            'withdrawal_id': withdrawal.id,
            'reference': withdrawal.reference,
            'method': withdrawal_method
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': f'Withdrawal error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)