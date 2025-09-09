from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def debug_withdrawal(request):
    """Debug withdrawal request data"""
    try:
        print("=== WITHDRAWAL DEBUG ===")
        print(f"User: {request.user}")
        print(f"Request data: {request.data}")
        print(f"Request method: {request.method}")
        
        # Check required fields
        amount = request.data.get('amount', 0)
        withdrawal_method = request.data.get('method', 'bank')
        account_number = request.data.get('account_number')
        account_name = request.data.get('account_name')
        bank_code = request.data.get('bank_code')
        
        print(f"Amount: {amount} (type: {type(amount)})")
        print(f"Method: {withdrawal_method}")
        print(f"Account number: {account_number}")
        print(f"Account name: {account_name}")
        print(f"Bank code: {bank_code}")
        
        # Check user profile
        from api.models import UserProfile
        user_profile, created = UserProfile.objects.get_or_create(user=request.user)
        print(f"User profile created: {created}")
        print(f"Available balance: {user_profile.available_balance}")
        
        return Response({
            'status': 'success',
            'message': 'Debug data logged to console',
            'data': {
                'user': str(request.user),
                'amount': amount,
                'method': withdrawal_method,
                'available_balance': float(user_profile.available_balance)
            }
        })
        
    except Exception as e:
        print(f"Debug error: {e}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)