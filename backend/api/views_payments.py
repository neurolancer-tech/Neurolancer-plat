from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from decimal import Decimal
import requests
from .models import *
from .paystack_utils import paystack
from .serializers import *
import time
from django.utils import timezone

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subaccount(request):
    """Create Paystack subaccount for freelancer"""
    user_profile = get_object_or_404(UserProfile, user=request.user)
    
    if user_profile.paystack_subaccount_code:
        return Response({
            'status': 'error',
            'message': 'Subaccount already exists'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    data = request.data
    business_name = data.get('business_name', f"{request.user.first_name} {request.user.last_name}")
    bank_code = data.get('bank_code')
    account_number = data.get('account_number')
    
    if not bank_code or not account_number:
        return Response({
            'status': 'error',
            'message': 'Bank code and account number are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify account first
    verify_response = paystack.resolve_account(account_number, bank_code)
    if not verify_response.get('status'):
        return Response({
            'status': 'error',
            'message': 'Invalid bank account details'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    account_name = verify_response['data']['account_name']
    
    # Create subaccount
    subaccount_response = paystack.create_subaccount(
        business_name=business_name,
        settlement_bank=bank_code,
        account_number=account_number,
        percentage_charge=5  # 5% platform fee from freelancer earnings
    )
    
    if subaccount_response.get('status'):
        subaccount_code = subaccount_response['data']['subaccount_code']
        
        # Update user profile
        user_profile.paystack_subaccount_code = subaccount_code
        user_profile.bank_code = bank_code
        user_profile.account_number = account_number
        user_profile.account_name = account_name
        user_profile.save()
        
        return Response({
            'status': 'success',
            'message': 'Subaccount created successfully',
            'data': {
                'subaccount_code': subaccount_code,
                'account_name': account_name
            }
        })
    else:
        return Response({
            'status': 'error',
            'message': subaccount_response.get('message', 'Failed to create subaccount')
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_banks(request):
    """Get list of supported banks"""
    banks_response = paystack.list_banks()
    
    if banks_response.get('status'):
        return Response({
            'status': 'success',
            'data': banks_response['data']
        })
    else:
        return Response({
            'status': 'error',
            'message': 'Failed to fetch banks'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_payment(request):
    """Initialize split payment for course/gig/job"""
    data = request.data
    payment_type = data.get('payment_type')  # 'course', 'gig', 'job'
    
    if payment_type == 'course':
        course_id = data.get('course_id')
        course = get_object_or_404(Course, id=course_id)
        
        # Convert USD to KES
        exchange_rate = get_exchange_rate()
        amount_kes = float(course.price) * exchange_rate
        
        # Get instructor's subaccount
        instructor_profile = course.instructor.userprofile
        if not instructor_profile.paystack_subaccount_code:
            return Response({
                'status': 'error',
                'message': 'Instructor payment details not set up'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        reference = f"course_{course.id}_{request.user.id}_{int(time.time())}"
        
        payment_response = paystack.initialize_split_payment(
            email=request.user.email,
            amount=amount_kes,
            subaccount_code=instructor_profile.paystack_subaccount_code,
            reference=reference,
            metadata={
                'payment_type': 'course',
                'course_id': course.id,
                'student_id': request.user.id
            }
        )
        
    elif payment_type == 'gig':
        order_id = data.get('order_id')
        order = get_object_or_404(Order, id=order_id, client=request.user)
        
        # Get freelancer's subaccount
        freelancer_profile = order.freelancer.userprofile
        if not freelancer_profile.paystack_subaccount_code:
            return Response({
                'status': 'error',
                'message': 'Freelancer payment details not set up'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert USD to KES
        exchange_rate = get_exchange_rate()
        amount_kes = float(order.price) * exchange_rate
        
        reference = f"order_{order.id}_{int(time.time())}"
        
        payment_response = paystack.initialize_split_payment(
            email=request.user.email,
            amount=amount_kes,
            subaccount_code=freelancer_profile.paystack_subaccount_code,
            reference=reference,
            metadata={
                'payment_type': 'gig',
                'order_id': order.id,
                'client_id': request.user.id
            }
        )
        
        # Update order with payment reference
        order.payment_reference = reference
        order.save()
    
    if payment_response.get('status'):
        return Response({
            'status': 'success',
            'data': payment_response['data']
        })
    else:
        return Response({
            'status': 'error',
            'message': payment_response.get('message', 'Payment initialization failed')
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def verify_payment(request):
    """Verify payment and update order/enrollment status"""
    reference = request.data.get('reference')
    
    if not reference:
        return Response({
            'status': 'error',
            'message': 'Payment reference is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify with Paystack
    verify_response = paystack.verify_payment(reference)
    
    if not verify_response.get('status'):
        return Response({
            'status': 'error',
            'message': 'Payment verification failed'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    payment_data = verify_response['data']
    
    if payment_data['status'] != 'success':
        return Response({
            'status': 'error',
            'message': 'Payment was not successful'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    metadata = payment_data.get('metadata', {})
    payment_type = metadata.get('payment_type')
    
    if payment_type == 'course':
        course_id = metadata.get('course_id')
        student_id = metadata.get('student_id')
        
        course = get_object_or_404(Course, id=course_id)
        student = get_object_or_404(User, id=student_id)
        
        # Create enrollment
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            course=course,
            defaults={
                'payment_reference': reference,
                'status': 'active'
            }
        )
        
        if created:
            course.enrollment_count += 1
            course.save()
        
    elif payment_type == 'gig':
        order_id = metadata.get('order_id')
        order = get_object_or_404(Order, id=order_id)
        
        # Update order status
        order.payment_status = 'paid'
        order.is_paid = True
        order.status = 'accepted'
        order.save()
        
        # Update freelancer earnings (held in escrow)
        freelancer_profile = order.freelancer.userprofile
        freelancer_profile.escrow_balance += order.price
        freelancer_profile.save()
        
        # Create notification for Paystack payment
        create_payment_notification(
            user=order.client,
            payment_method='paystack',
            amount=Decimal(str(payment_data['amount'])) / 100,  # Convert from kobo
            reference=reference,
            status='completed'
        )
    
    return Response({
        'status': 'success',
        'message': 'Payment verified and processed successfully'
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def wallet_payment(request):
    """Process payment using wallet balance"""
    data = request.data
    amount = Decimal(str(data.get('amount', 0)))
    payment_type = data.get('payment_type')
    
    user_profile = get_object_or_404(UserProfile, user=request.user)
    
    # Check if user has sufficient balance
    if user_profile.available_balance < amount:
        return Response({
            'status': 'error',
            'message': 'Insufficient wallet balance'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Deduct amount from wallet
    user_profile.available_balance -= amount
    user_profile.save()
    
    # Generate payment reference
    reference = f"wallet_{request.user.id}_{int(time.time())}"
    
    # Create transaction record
    Transaction.objects.create(
        user=request.user,
        transaction_type='payment',
        amount=amount,
        description=f"Wallet payment for {payment_type}",
        reference=reference,
        status='completed'
    )
    
    # Create notification
    create_payment_notification(
        user=request.user,
        payment_method='wallet',
        amount=amount,
        reference=reference,
        status='completed'
    )
    
    # Handle specific payment types
    if payment_type == 'course':
        course_id = data.get('course_id')
        if course_id:
            course = get_object_or_404(Course, id=course_id)
            enrollment, created = Enrollment.objects.get_or_create(
                student=request.user,
                course=course,
                defaults={
                    'payment_reference': reference,
                    'status': 'active'
                }
            )
            if created:
                course.enrollment_count += 1
                course.save()
    
    elif payment_type == 'assessment':
        assessment_id = data.get('assessment_id')
        if assessment_id:
            from .models import Assessment, AssessmentPayment
            assessment = get_object_or_404(Assessment, id=assessment_id)
            
            # Create assessment payment record
            AssessmentPayment.objects.create(
                user=request.user,
                assessment=assessment,
                amount=amount,
                payment_reference=reference,
                status='completed',
                paid_at=timezone.now()
            )
    
    elif payment_type == 'gig':
        order_id = data.get('order_id')
        if order_id:
            order = get_object_or_404(Order, id=order_id, client=request.user)
            order.payment_status = 'paid'
            order.is_paid = True
            order.status = 'accepted'
            order.payment_reference = reference
            order.save()
            
            # Update freelancer earnings (held in escrow)  
            freelancer_profile = order.freelancer.userprofile
            freelancer_profile.escrow_balance += order.price
            freelancer_profile.save()
    
    return Response({
        'status': 'success',
        'message': 'Payment completed successfully',
        'reference': reference,
        'new_balance': float(user_profile.available_balance)
    })

def create_payment_notification(user, payment_method, amount, reference, status):
    """Create payment notification for user"""
    title = f"Payment {status.title()}"
    
    if payment_method == 'wallet':
        message = f"Your wallet payment of KES {amount:,.2f} has been processed successfully. Reference: {reference}"
        notification_type = 'payment'
    else:
        message = f"Your Paystack payment of KES {amount:,.2f} has been {status}. Reference: {reference}"
        notification_type = 'payment'
    
    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        action_url=f'/transactions?ref={reference}'
    )

def get_exchange_rate():
    """Get USD to KES exchange rate"""
    try:
        response = requests.get('https://api.exchangerate-api.com/v4/latest/USD')
        data = response.json()
        return data['rates']['KES']
    except:
        return 130  # Fallback rate