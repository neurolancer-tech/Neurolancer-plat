import requests
import json
import time
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import UserProfile, Withdrawal
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

# Paystack Test Credentials
PAYSTACK_SECRET_KEY = 'sk_test_fd47bd1c9a97e30551cc3bb2def6d664d1671246'
PAYSTACK_PUBLIC_KEY = 'pk_test_ce9730c10c85c796d2382e48d8635c0dcb59dd1a'
PAYSTACK_BASE_URL = 'https://api.paystack.co'

class PaystackWithdrawal:
    def __init__(self):
        self.secret_key = PAYSTACK_SECRET_KEY
        self.headers = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json',
        }

    def list_banks(self, country='kenya'):
        """Get list of supported banks"""
        url = f'{PAYSTACK_BASE_URL}/bank'
        params = {'country': country, 'use_cursor': 'false', 'perPage': 100}
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f'Paystack banks list error: {e}')
            return None

    def resolve_account(self, account_number, bank_code):
        """Resolve account number to get account name"""
        url = f'{PAYSTACK_BASE_URL}/bank/resolve'
        params = {
            'account_number': account_number,
            'bank_code': bank_code
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f'Account resolution error: {e}')
            return None

    def create_transfer_recipient(self, name, account_number, bank_code):
        """Create a transfer recipient"""
        url = f'{PAYSTACK_BASE_URL}/transferrecipient'
        
        data = {
            'type': 'nuban',
            'name': name,
            'account_number': account_number,
            'bank_code': bank_code,
            'currency': 'KES'
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f'Transfer recipient creation error: {e}')
            return None

    def initiate_transfer(self, amount, recipient_code, reason):
        """Initiate a transfer"""
        url = f'{PAYSTACK_BASE_URL}/transfer'
        
        data = {
            'source': 'balance',
            'amount': int(float(amount) * 100),  # Convert to cents
            'recipient': recipient_code,
            'reason': reason,
            'currency': 'KES'
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f'Transfer initiation error: {e}')
            return None

# Initialize Paystack instance
paystack_withdrawal = PaystackWithdrawal()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def paystack_withdraw(request):
    """Paystack withdrawal with test credentials"""
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
        
        # Step 1: Resolve account to verify it exists
        account_resolution = paystack_withdrawal.resolve_account(account_number, bank_code)
        
        if not account_resolution or not account_resolution.get('status'):
            return Response({
                'error': 'Invalid bank account details. Please verify your account number and bank.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        resolved_name = account_resolution['data']['account_name']
        
        # Step 2: Create transfer recipient
        recipient_result = paystack_withdrawal.create_transfer_recipient(
            name=account_name,
            account_number=account_number,
            bank_code=bank_code
        )
        
        if not recipient_result or not recipient_result.get('status'):
            return Response({
                'error': 'Failed to create transfer recipient. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        recipient_code = recipient_result['data']['recipient_code']
        
        # Step 3: Initiate transfer
        transfer_result = paystack_withdrawal.initiate_transfer(
            amount=amount,
            recipient_code=recipient_code,
            reason=f'Withdrawal for {request.user.get_full_name() or request.user.username}'
        )
        
        if transfer_result and transfer_result.get('status'):
            # Deduct from available balance
            user_profile.available_balance -= Decimal(str(amount))
            user_profile.save()
            
            # Create withdrawal record
            withdrawal = Withdrawal.objects.create(
                user=request.user,
                amount=amount,
                bank_name=f'Bank Code: {bank_code}',
                account_number=account_number,
                status='processing',
                reference=transfer_result['data']['reference'],
                paystack_recipient_code=recipient_code,
                paystack_transfer_code=transfer_result['data'].get('transfer_code', '')
            )
            
            return Response({
                'status': 'success',
                'message': 'Withdrawal initiated successfully via Paystack',
                'data': {
                    'withdrawal_id': withdrawal.id,
                    'reference': transfer_result['data']['reference'],
                    'resolved_account_name': resolved_name,
                    'amount': amount,
                    'transfer_code': transfer_result['data'].get('transfer_code', ''),
                    'status': transfer_result['data'].get('status', 'processing')
                }
            })
        else:
            error_msg = 'Transfer initiation failed'
            if transfer_result and 'message' in transfer_result:
                error_msg = transfer_result['message']
            
            return Response({
                'error': error_msg
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f'Paystack withdrawal error: {e}')
        import traceback
        traceback.print_exc()
        return Response({
            'error': f'Withdrawal error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_recipient(request):
    """Create a Paystack transfer recipient"""
    try:
        name = request.data.get('name')
        account_number = request.data.get('account_number')
        bank_code = request.data.get('bank_code')
        
        if not all([name, account_number, bank_code]):
            return Response({
                'error': 'Name, account number, and bank code are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # First resolve account to verify
        account_resolution = paystack_withdrawal.resolve_account(account_number, bank_code)
        
        if not account_resolution or not account_resolution.get('status'):
            return Response({
                'error': 'Invalid bank account details. Please verify your account number and bank.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create recipient
        recipient_result = paystack_withdrawal.create_transfer_recipient(
            name=name,
            account_number=account_number,
            bank_code=bank_code
        )
        
        if recipient_result and recipient_result.get('status'):
            return Response({
                'status': 'success',
                'data': {
                    'recipient_code': recipient_result['data']['recipient_code'],
                    'resolved_name': account_resolution['data']['account_name']
                }
            })
        else:
            return Response({
                'error': 'Failed to create recipient'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f'Create recipient error: {e}')
        return Response({
            'error': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_withdrawal(request):
    """Process withdrawal using existing recipient"""
    try:
        amount = float(request.data.get('amount', 0))
        recipient = request.data.get('recipient')
        reason = request.data.get('reason', 'Neurolancer withdrawal')
        reference = request.data.get('reference', f'neurolancer_{int(time.time())}')
        
        if not all([amount, recipient]):
            return Response({
                'error': 'Amount and recipient are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check user's available balance
        user_profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        if user_profile.available_balance < amount:
            return Response({
                'error': f'Insufficient balance. Available: ${user_profile.available_balance}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Initiate transfer
        transfer_result = paystack_withdrawal.initiate_transfer(
            amount=amount,
            recipient_code=recipient,
            reason=reason
        )
        
        if transfer_result and transfer_result.get('status'):
            # Deduct from available balance
            user_profile.available_balance -= Decimal(str(amount))
            user_profile.save()
            
            # Create withdrawal record
            withdrawal = Withdrawal.objects.create(
                user=request.user,
                amount=amount,
                bank_name='Paystack Transfer',
                account_number='****',
                status='processing',
                reference=transfer_result['data']['reference'],
                paystack_recipient_code=recipient,
                paystack_transfer_code=transfer_result['data'].get('transfer_code', '')
            )
            
            return Response({
                'status': 'success',
                'message': 'Withdrawal processed successfully',
                'data': {
                    'withdrawal_id': withdrawal.id,
                    'reference': transfer_result['data']['reference'],
                    'amount': amount,
                    'status': transfer_result['data'].get('status', 'processing')
                }
            })
        else:
            error_msg = 'Transfer failed'
            if transfer_result and 'message' in transfer_result:
                error_msg = transfer_result['message']
            
            return Response({
                'error': error_msg
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f'Process withdrawal error: {e}')
        return Response({
            'error': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_paystack_banks(request):
    """Get list of Paystack supported banks"""
    try:
        result = paystack_withdrawal.list_banks('kenya')
        
        if result and result.get('status'):
            return Response({
                'status': 'success',
                'data': result['data']
            })
        else:
            return Response({
                'error': 'Failed to fetch banks'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f'Banks list error: {e}')
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)