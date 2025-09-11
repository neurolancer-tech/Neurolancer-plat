from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Transaction, UserProfile
from .serializers import TransactionSerializer
from .views import IsAdminPermission

class AdminTransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAdminPermission]
    
    def get_queryset(self):
        return Transaction.objects.all().select_related('user', 'order').order_by('-created_at')

@api_view(['GET'])
@permission_classes([IsAdminPermission])
def admin_transactions(request):
    """Get all transactions for admin dashboard"""
    try:
        transactions = Transaction.objects.all().select_related('user', 'order').order_by('-created_at')
        
        transaction_data = []
        for transaction in transactions:
            transaction_data.append({
                'id': transaction.id,
                'transaction_type': transaction.transaction_type,
                'amount': float(transaction.amount),
                'status': transaction.status,
                'user': {
                    'id': transaction.user.id,
                    'username': transaction.user.username,
                    'first_name': transaction.user.first_name,
                    'last_name': transaction.user.last_name,
                    'email': transaction.user.email
                },
                'order': {
                    'id': transaction.order.id,
                    'gig': {
                        'title': transaction.order.gig.title if transaction.order.gig else transaction.description
                    }
                } if transaction.order else None,
                'description': transaction.description,
                'reference': transaction.reference,
                'created_at': transaction.created_at.isoformat()
            })
        
        return Response({
            'results': transaction_data,
            'count': len(transaction_data)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['PUT'])
@permission_classes([IsAdminPermission])
def update_transaction_status(request, transaction_id):
    """Update transaction status"""
    try:
        transaction = Transaction.objects.get(id=transaction_id)
        new_status = request.data.get('status')
        
        if new_status in ['pending', 'completed', 'failed', 'cancelled']:
            transaction.status = new_status
            transaction.save()
            
            return Response({
                'message': 'Transaction status updated successfully',
                'transaction': {
                    'id': transaction.id,
                    'status': transaction.status
                }
            })
        else:
            return Response({'error': 'Invalid status'}, status=400)
            
    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)