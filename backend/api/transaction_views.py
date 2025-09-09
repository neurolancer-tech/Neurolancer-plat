from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Transaction, UserProfile
from django.contrib.auth.models import User
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def record_transaction(request):
    """Record a successful payment transaction"""
    try:
        reference = request.data.get('reference')
        amount = float(request.data.get('amount', 0))
        project = request.data.get('project', '')
        freelancer_name = request.data.get('freelancer', '')
        
        if not reference or not amount:
            return Response({'error': 'Reference and amount are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find freelancer by name (simplified - in production use proper ID)
        try:
            freelancer = User.objects.filter(first_name__icontains=freelancer_name).first()
            if not freelancer:
                freelancer = User.objects.filter(username__icontains=freelancer_name).first()
        except:
            freelancer = None
        
        if freelancer:
            # Create transaction record
            transaction = Transaction.objects.create(
                user=freelancer,
                transaction_type='payment',
                amount=amount,
                description=f'Payment for {project}',
                reference=reference,
                status='completed'
            )
            
            # Update freelancer's total earnings
            profile, created = UserProfile.objects.get_or_create(user=freelancer)
            profile.total_earnings += Decimal(str(amount))
            profile.available_balance += Decimal(str(amount))
            profile.save()
            
            return Response({
                'status': 'success',
                'message': 'Transaction recorded successfully',
                'transaction_id': transaction.id
            })
        else:
            return Response({
                'status': 'success',
                'message': 'Payment recorded (freelancer not found)'
            })
            
    except Exception as e:
        logger.error(f'Transaction recording error: {e}')
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transactions(request):
    """Get user's transaction history"""
    try:
        transactions = Transaction.objects.filter(user=request.user).order_by('-created_at')
        
        transaction_data = []
        for transaction in transactions:
            transaction_data.append({
                'id': transaction.id,
                'type': transaction.transaction_type,
                'amount': float(transaction.amount),
                'description': transaction.description,
                'reference': transaction.reference,
                'status': transaction.status,
                'created_at': transaction.created_at.isoformat()
            })
        
        return Response({
            'status': 'success',
            'transactions': transaction_data
        })
        
    except Exception as e:
        logger.error(f'Transaction retrieval error: {e}')
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)