import requests
import json
import hashlib
import hmac
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Order, UserProfile, Transaction, Job, Withdrawal
from decimal import Decimal
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Paystack configuration
PAYSTACK_SECRET_KEY = getattr(settings, 'PAYSTACK_SECRET_KEY', 'sk_test_your_secret_key_here')
PAYSTACK_PUBLIC_KEY = getattr(settings, 'PAYSTACK_PUBLIC_KEY', 'pk_test_your_public_key_here')
PAYSTACK_BASE_URL = 'https://api.paystack.co'

# Platform configuration
FREELANCER_FEE_PERCENTAGE = Decimal('0.05')  # 5% fee from freelancer earnings
CLIENT_FEE_PERCENTAGE = Decimal('0.025')  # 2.5% fee from client payment
PROCESSING_FEE_KES = Decimal('50.00')  # 50 KES processing fee
PLATFORM_ACCOUNT_NUMBER = '1234567890'  # Platform's M-Pesa account
KES_TO_USD_RATE = Decimal('0.0077')  # Approximate conversion rate (1 KES = 0.0077 USD)
USD_TO_KES_RATE = Decimal('130.0')   # Approximate conversion rate (1 USD = 130 KES)

def convert_kes_to_usd(kes_amount):
    """Convert KES amount to USD for dashboard display"""
    return kes_amount * KES_TO_USD_RATE

def convert_usd_to_kes(usd_amount):
    """Convert USD amount to KES for Paystack processing"""
    return usd_amount * USD_TO_KES_RATE

class PaystackAPI:
    def __init__(self):
        self.secret_key = PAYSTACK_SECRET_KEY
        self.base_url = PAYSTACK_BASE_URL
        self.headers = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json',
        }

    def initialize_transaction(self, email, amount, reference, callback_url=None, metadata=None, channels=None):
        """Initialize a payment transaction with M-Pesa support"""
        url = f'{self.base_url}/transaction/initialize'
        
        # Convert amount to cents (KES cents)
        amount_cents = int(float(amount) * 100)
        
        data = {
            'email': email,
            'amount': amount_cents,
            'reference': reference,
            'currency': 'KES',  # Kenyan Shillings
            'channels': channels or ['card', 'mobile_money', 'bank'],  # Enable M-Pesa via mobile_money
        }
        
        if callback_url:
            data['callback_url'] = callback_url
            
        if metadata:
            data['metadata'] = metadata
            
        try:
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f'Paystack API error: {e}')
            return None

    def verify_transaction(self, reference):
        """Verify a payment transaction"""
        url = f'{self.base_url}/transaction/verify/{reference}'
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f'Paystack verification error: {e}')
            return None

    def create_transfer_recipient(self, name, account_number, bank_code, recipient_type='mobile_money'):
        """Create a transfer recipient for withdrawals (M-Pesa support)"""
        url = f'{self.base_url}/transferrecipient'
        
        data = {
            'type': recipient_type,  # 'mobile_money' for M-Pesa, 'nuban' for bank
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
            logger.error(f'Paystack recipient creation error: {e}')
            return None

    def initiate_transfer(self, amount, recipient_code, reason):
        """Initiate a transfer for withdrawals"""
        url = f'{self.base_url}/transfer'
        
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
            logger.error(f'Paystack transfer error: {e}')
            return None

    def list_banks(self, country='kenya'):
        """Get list of supported banks and mobile money providers"""
        url = f'{self.base_url}/bank'
        params = {'country': country, 'use_cursor': 'false', 'perPage': 100}
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f'Paystack banks list error: {e}')
            return None

# Initialize Paystack API instance
paystack = PaystackAPI()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_payment(request):
    """Initialize payment for an order with enhanced fee calculation"""
    try:
        order_id = request.data.get('order_id')
        job_id = request.data.get('job_id')
        course_id = request.data.get('course_id')
        amount = request.data.get('amount')
        hours_worked = request.data.get('hours_worked')
        hourly_rate = request.data.get('hourly_rate')
        payment_type = request.data.get('payment_type', 'gig')  # 'gig', 'job', or 'course'
        
        if not (order_id or (job_id and amount) or (course_id and amount)):
            return Response({'error': 'Order ID, Job ID with amount, or Course ID with amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle different payment types
        if order_id:
            try:
                order = Order.objects.get(id=order_id, client=request.user)
                if order.payment_status != 'pending':
                    return Response({'error': 'Order payment already processed'}, status=status.HTTP_400_BAD_REQUEST)
                
                base_amount = order.price
                freelancer = order.freelancer
                reference_prefix = f'neurolancer_order_{order.id}'
                description = f'Payment for gig: {order.title}'
                
            except Order.DoesNotExist:
                return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        elif job_id:
            try:
                job = Job.objects.get(id=job_id, client=request.user)
                
                # Calculate amount based on hourly work if provided
                if hours_worked and hourly_rate:
                    base_amount = Decimal(str(hours_worked)) * Decimal(str(hourly_rate))
                else:
                    base_amount = Decimal(str(amount))
                
                # Find freelancer from job proposals (simplified)
                freelancer_id = request.data.get('freelancer_id')
                if not freelancer_id:
                    return Response({'error': 'Freelancer ID is required for job payments'}, status=status.HTTP_400_BAD_REQUEST)
                
                from django.contrib.auth.models import User
                freelancer = User.objects.get(id=freelancer_id)
                reference_prefix = f'neurolancer_job_{job.id}'
                description = f'Payment for job: {job.title}'
                
            except (Job.DoesNotExist, User.DoesNotExist):
                return Response({'error': 'Job or freelancer not found'}, status=status.HTTP_404_NOT_FOUND)
        
        elif course_id:
            try:
                from .models import Course
                course = Course.objects.get(id=course_id)
                
                base_amount = Decimal(str(course.price))
                freelancer = course.instructor  # Course instructor receives payment
                reference_prefix = f'neurolancer_course_{course.id}'
                description = f'Course enrollment: {course.title}'
                
            except Course.DoesNotExist:
                return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Calculate fees
        client_fee = base_amount * CLIENT_FEE_PERCENTAGE  # 2.5% from client
        processing_fee = PROCESSING_FEE_KES
        total_amount = base_amount + client_fee + processing_fee
        
        # Generate unique reference
        reference = f'{reference_prefix}_{datetime.now().strftime("%Y%m%d%H%M%S")}'
        
        # Prepare metadata
        metadata = {
            'payment_type': payment_type,
            'client_id': request.user.id,
            'freelancer_id': freelancer.id,
            'base_amount': str(base_amount),
            'client_fee': str(client_fee),
            'processing_fee': str(processing_fee),
            'total_amount': str(total_amount),
            'platform_account': PLATFORM_ACCOUNT_NUMBER,
            'custom_fields': [
                {
                    'display_name': 'Payment Type',
                    'variable_name': 'payment_type',
                    'value': payment_type
                },
                {
                    'display_name': 'Base Amount (KES)',
                    'variable_name': 'base_amount',
                    'value': str(base_amount)
                }
            ]
        }
        
        if order_id:
            metadata['order_id'] = order_id
            metadata['gig_id'] = order.gig.id
        elif job_id:
            metadata['job_id'] = job_id
            if hours_worked:
                metadata['hours_worked'] = str(hours_worked)
                metadata['hourly_rate'] = str(hourly_rate)
        elif course_id:
            metadata['course_id'] = course_id
        
        # Initialize transaction with Paystack (M-Pesa enabled)
        result = paystack.initialize_transaction(
            email=request.user.email,
            amount=float(total_amount),
            reference=reference,
            callback_url=f'{settings.FRONTEND_URL}/payment/callback?reference={reference}',
            metadata=metadata,
            channels=['card', 'mobile_money', 'bank']  # Enable M-Pesa
        )
        
        if result and result.get('status'):
            # Update order with payment reference if it's an order payment
            if order_id:
                order.payment_reference = reference
                order.total_amount = total_amount
                order.save()
            
            return Response({
                'status': 'success',
                'data': {
                    'authorization_url': result['data']['authorization_url'],
                    'access_code': result['data']['access_code'],
                    'reference': reference,
                    'amount_breakdown': {
                        'base_amount': float(base_amount),
                        'client_fee': float(client_fee),
                        'processing_fee': float(processing_fee),
                        'total_amount': float(total_amount)
                    }
                }
            })
        else:
            return Response({'error': 'Failed to initialize payment'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f'Payment initialization error: {e}')
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def verify_payment(request):
    """Verify payment callback from Paystack"""
    try:
        reference = request.data.get('reference')
        
        if not reference:
            return Response({'error': 'Reference is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify transaction with Paystack
        result = paystack.verify_transaction(reference)
        
        if result and result.get('status') and result['data']['status'] == 'success':
            # Find the order
            try:
                order = Order.objects.get(payment_reference=reference)
            except Order.DoesNotExist:
                return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Update order status
            order.payment_status = 'paid'
            order.status = 'in_progress'
            order.save()
            
            # Update freelancer's escrow balance
            freelancer_profile, created = UserProfile.objects.get_or_create(user=order.freelancer)
            freelancer_profile.escrow_balance += order.total_amount
            freelancer_profile.save()
            
            return Response({
                'status': 'success',
                'message': 'Payment verified successfully',
                'order_id': order.id
            })
        else:
            return Response({'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f'Payment verification error: {e}')
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@require_http_methods(["POST"])
def paystack_webhook(request):
    """Handle Paystack webhooks"""
    try:
        # Verify webhook signature
        signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE')
        if not signature:
            return JsonResponse({'error': 'No signature provided'}, status=400)
        
        # Compute expected signature
        expected_signature = hmac.new(
            PAYSTACK_SECRET_KEY.encode('utf-8'),
            request.body,
            hashlib.sha512
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            return JsonResponse({'error': 'Invalid signature'}, status=400)
        
        # Parse webhook data
        data = json.loads(request.body)
        event = data.get('event')
        
        if event == 'charge.success':
            # Handle successful payment
            reference = data['data']['reference']
            
            try:
                order = Order.objects.get(payment_reference=reference)
                if order.payment_status == 'pending':
                    order.payment_status = 'paid'
                    order.status = 'in_progress'
                    order.save()
                    
                    # Update freelancer's escrow balance
                    freelancer_profile, created = UserProfile.objects.get_or_create(user=order.freelancer)
                    freelancer_profile.escrow_balance += order.total_amount
                    freelancer_profile.save()
                    
            except Order.DoesNotExist:
                logger.error(f'Order not found for reference: {reference}')
        
        elif event == 'transfer.success':
            # Handle successful withdrawal
            reference = data['data']['reference']
            # Update withdrawal status if needed
            
        elif event == 'transfer.failed':
            # Handle failed withdrawal
            reference = data['data']['reference']
            # Update withdrawal status if needed
            
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        logger.error(f'Webhook error: {e}')
        return JsonResponse({'error': 'Internal server error'}, status=500)



@api_view(['GET'])
def get_banks(request):
    """Get list of supported banks"""
    try:
        result = paystack.list_banks()
        
        if result and result.get('status'):
            return Response({
                'status': 'success',
                'data': result['data']
            })
        else:
            return Response({'error': 'Failed to fetch banks'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f'Banks list error: {e}')
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def release_escrow(request):
    """Release escrow funds when order is completed"""
    try:
        order_id = request.data.get('order_id')
        
        if not order_id:
            return Response({'error': 'Order ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            order = Order.objects.get(id=order_id, client=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if order.status != 'delivered':
            return Response({'error': 'Order must be delivered before releasing escrow'}, status=status.HTTP_400_BAD_REQUEST)
        
        if order.payment_status != 'paid':
            return Response({'error': 'Order payment not confirmed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Release escrow funds
        order.status = 'completed'
        order.escrow_released = True
        order.save()
        
        # Update freelancer's available balance
        freelancer_profile, created = UserProfile.objects.get_or_create(user=order.freelancer)
        freelancer_profile.escrow_balance -= order.total_amount
        freelancer_profile.available_balance += order.total_amount
        freelancer_profile.save()
        
        return Response({
            'status': 'success',
            'message': 'Escrow funds released successfully'
        })
        
    except Exception as e:
        logger.error(f'Escrow release error: {e}')
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def verify_payment(request):
    """Verify payment callback from Paystack with platform fee handling"""
    try:
        reference = request.data.get('reference')
        
        if not reference:
            return Response({'error': 'Reference is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify transaction with Paystack
        result = paystack.verify_transaction(reference)
        
        if result and result.get('status') and result['data']['status'] == 'success':
            payment_data = result['data']
            metadata = payment_data.get('metadata', {})
            
            # Extract payment details
            payment_type = metadata.get('payment_type', 'gig')
            base_amount = Decimal(metadata.get('base_amount', '0'))
            client_fee = Decimal(metadata.get('client_fee', '0'))
            processing_fee = Decimal(metadata.get('processing_fee', '0'))
            total_paid = Decimal(str(payment_data['amount'])) / 100  # Convert from cents
            
            # Calculate freelancer fee (5% from their earnings)
            freelancer_fee = base_amount * FREELANCER_FEE_PERCENTAGE
            freelancer_earnings = base_amount - freelancer_fee
            
            freelancer_id = metadata.get('freelancer_id')
            client_id = metadata.get('client_id')
            
            # Handle order payments
            if payment_type == 'gig' and metadata.get('order_id'):
                try:
                    order = Order.objects.get(payment_reference=reference)
                    order.payment_status = 'paid'
                    order.status = 'in_progress'
                    order.is_paid = True
                    order.save()
                    
                    # Update freelancer's escrow balance (convert KES to USD for dashboard)
                    # Deduct freelancer fee (5%) from their earnings
                    freelancer_profile, created = UserProfile.objects.get_or_create(user=order.freelancer)
                    usd_amount = convert_kes_to_usd(freelancer_earnings)
                    freelancer_profile.escrow_balance += usd_amount
                    freelancer_profile.save()
                    
                    # Create transaction records
                    Transaction.objects.create(
                        user=order.client,
                        transaction_type='payment',
                        amount=-total_paid,
                        description=f'Payment for gig: {order.title}',
                        reference=reference,
                        status='completed',
                        order=order
                    )
                    
                    Transaction.objects.create(
                        user=order.freelancer,
                        transaction_type='payment',
                        amount=freelancer_earnings,
                        description=f'Received payment for gig: {order.title} (after 5% platform fee)',
                        reference=reference,
                        status='completed',
                        order=order
                    )
                    
                    # Process referral earnings for first purchase
                    try:
                        from .referral_service import ReferralService
                        ReferralService.check_first_purchase(order.client)
                        ReferralService.process_earnings_percentage(order.client, base_amount, order.id)
                    except Exception as e:
                        logger.error(f'Error processing referral earnings: {e}')
                    
                    # Create payment notifications
                    from .models import Notification
                    Notification.objects.create(
                        user=order.client,
                        title='Payment Completed',
                        message=f'Your Paystack payment of KES {total_paid:,.2f} for "{order.title}" has been processed successfully. Reference: {reference}',
                        notification_type='payment',
                        action_url=f'/transactions?ref={reference}'
                    )
                    
                    Notification.objects.create(
                        user=order.freelancer,
                        title='Payment Received',
                        message=f'You have received a payment of KES {freelancer_earnings:,.2f} for "{order.title}" (KES {freelancer_fee:,.2f} platform fee deducted). Funds are held in escrow until order completion.',
                        notification_type='payment',
                        action_url=f'/my-orders'
                    )
                    
                    response_data = {'order_id': order.id}
                    
                except Order.DoesNotExist:
                    return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Handle job payments
            elif payment_type == 'job' and metadata.get('job_id'):
                from django.contrib.auth.models import User
                
                try:
                    job = Job.objects.get(id=metadata['job_id'])
                    freelancer = User.objects.get(id=freelancer_id)
                    client = User.objects.get(id=client_id)
                    
                    # Update freelancer's escrow balance (convert KES to USD for dashboard)
                    freelancer_profile, created = UserProfile.objects.get_or_create(user=freelancer)
                    usd_amount = convert_kes_to_usd(base_amount)
                    freelancer_profile.escrow_balance += usd_amount
                    freelancer_profile.save()
                    
                    # Create transaction records
                    Transaction.objects.create(
                        user=client,
                        transaction_type='payment',
                        amount=-total_paid,
                        description=f'Payment for job: {job.title}',
                        reference=reference,
                        status='completed'
                    )
                    
                    Transaction.objects.create(
                        user=freelancer,
                        transaction_type='payment',
                        amount=base_amount,
                        description=f'Received payment for job: {job.title}',
                        reference=reference,
                        status='completed'
                    )
                    
                    # Create payment notifications
                    from .models import Notification
                    Notification.objects.create(
                        user=client,
                        title='Payment Completed',
                        message=f'Your Paystack payment of KES {total_paid:,.2f} for "{job.title}" has been processed successfully. Reference: {reference}',
                        notification_type='payment',
                        action_url=f'/transactions?ref={reference}'
                    )
                    
                    Notification.objects.create(
                        user=freelancer,
                        title='Payment Received',
                        message=f'You have received a payment of KES {base_amount:,.2f} for "{job.title}". Funds are held in escrow until job completion.',
                        notification_type='payment',
                        action_url=f'/my-jobs'
                    )
                    
                    response_data = {'job_id': job.id}
                    
                except (Job.DoesNotExist, User.DoesNotExist):
                    return Response({'error': 'Job or user not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Handle course payments
            elif payment_type == 'course' and metadata.get('course_id'):
                from django.contrib.auth.models import User
                from .models import Course, Enrollment
                
                try:
                    course = Course.objects.get(id=metadata['course_id'])
                    client = User.objects.get(id=client_id)
                    
                    # Create enrollment
                    enrollment, created = Enrollment.objects.get_or_create(
                        student=client,
                        course=course,
                        defaults={'payment_reference': reference}
                    )
                    
                    if created:
                        # Update course enrollment count
                        course.enrollment_count += 1
                        course.save()
                        
                        # Update instructor's escrow balance (convert KES to USD for dashboard)
                        instructor_profile, created = UserProfile.objects.get_or_create(user=course.instructor)
                        usd_amount = convert_kes_to_usd(base_amount)
                        instructor_profile.escrow_balance += usd_amount
                        instructor_profile.save()
                        
                        # Create transaction records
                        Transaction.objects.create(
                            user=client,
                            transaction_type='payment',
                            amount=-total_paid,
                            description=f'Course enrollment: {course.title}',
                            reference=reference,
                            status='completed'
                        )
                        
                        Transaction.objects.create(
                            user=course.instructor,
                            transaction_type='payment',
                            amount=base_amount,
                            description=f'Course enrollment payment: {course.title}',
                            reference=reference,
                            status='completed'
                        )
                        
                        # Create notification for student
                        from .models import Notification
                        Notification.objects.create(
                            user=client,
                            title=f'Course Enrollment Successful',
                            message=f'You have successfully enrolled in "{course.title}". You can now access all course materials.',
                            notification_type='course',
                            action_url=f'/my-courses',
                            related_object_id=course.id
                        )
                        
                        # Create payment notification
                        Notification.objects.create(
                            user=client,
                            title='Payment Completed',
                            message=f'Your Paystack payment of KES {total_paid:,.2f} for "{course.title}" has been processed successfully. Reference: {reference}',
                            notification_type='payment',
                            action_url=f'/transactions?ref={reference}'
                        )
                    
                    response_data = {'course_id': course.id, 'enrollment_id': enrollment.id}
                    
                except (Course.DoesNotExist, User.DoesNotExist):
                    return Response({'error': 'Course or user not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Record platform fees
            total_platform_fees = client_fee + freelancer_fee + processing_fee
            if total_platform_fees > 0:
                # Create platform fee transaction (could be to admin user or system account)
                Transaction.objects.create(
                    user_id=1,  # Assuming admin user ID is 1
                    transaction_type='fee',
                    amount=total_platform_fees,
                    description=f'Platform fees (Client: {client_fee}, Freelancer: {freelancer_fee}) and processing fees for {reference}',
                    reference=f'{reference}_fees',
                    status='completed'
                )
            
            return Response({
                'status': 'success',
                'message': 'Payment verified successfully',
                'payment_breakdown': {
                    'base_amount': float(base_amount),
                    'client_fee': float(client_fee),
                    'freelancer_fee': float(freelancer_fee),
                    'processing_fee': float(processing_fee),
                    'total_paid': float(total_paid),
                    'freelancer_earnings': float(freelancer_earnings)
                },
                **response_data
            })
        else:
            return Response({'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f'Payment verification error: {e}')
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_withdrawal(request):
    """Initiate withdrawal for freelancers with M-Pesa support"""
    try:
        amount = float(request.data.get('amount', 0))
        withdrawal_method = request.data.get('method', 'bank')  # 'bank' or 'mpesa'
        account_number = request.data.get('account_number')
        account_name = request.data.get('account_name')
        bank_code = request.data.get('bank_code')
        
        if not all([amount, account_number, account_name]):
            return Response({'error': 'Amount, account number, and account name are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check user's available balance (amount is in KES, but balance is stored in USD)
        user_profile, created = UserProfile.objects.get_or_create(user=request.user)
        usd_amount = convert_kes_to_usd(Decimal(str(amount)))
        
        if user_profile.available_balance < usd_amount:
            return Response({'error': f'Insufficient balance. Available: ${user_profile.available_balance}, Required: ${usd_amount}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine recipient type and bank code
        if withdrawal_method == 'mpesa':
            recipient_type = 'mobile_money'
            bank_code = bank_code or 'MPesa'  # M-Pesa bank code
        else:
            recipient_type = 'nuban'
            if not bank_code:
                return Response({'error': 'Bank code is required for bank transfers'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create transfer recipient
        recipient_result = paystack.create_transfer_recipient(
            name=account_name,
            account_number=account_number,
            bank_code=bank_code,
            recipient_type=recipient_type
        )
        
        if not recipient_result or not recipient_result.get('status'):
            return Response({'error': 'Failed to create transfer recipient'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        recipient_code = recipient_result['data']['recipient_code']
        
        # Initiate transfer
        transfer_result = paystack.initiate_transfer(
            amount=amount,
            recipient_code=recipient_code,
            reason=f'Withdrawal for {request.user.get_full_name() or request.user.username}'
        )
        
        if transfer_result and transfer_result.get('status'):
            # Deduct from available balance (convert KES withdrawal to USD)
            user_profile.available_balance -= usd_amount
            user_profile.save()
            
            # Create withdrawal record
            withdrawal = Withdrawal.objects.create(
                user=request.user,
                amount=amount,
                bank_name=f'{withdrawal_method.upper()}: {bank_code}',
                account_number=account_number,
                status='processing',
                reference=transfer_result['data']['reference'],
                paystack_recipient_code=recipient_code,
                paystack_transfer_code=transfer_result['data'].get('transfer_code', '')
            )
            
            # Create transaction record
            Transaction.objects.create(
                user=request.user,
                transaction_type='withdrawal',
                amount=-Decimal(str(amount)),
                description=f'Withdrawal to {withdrawal_method.upper()}: {account_number}',
                reference=transfer_result['data']['reference'],
                status='pending'
            )
            
            return Response({
                'status': 'success',
                'message': f'Withdrawal to {withdrawal_method.upper()} initiated successfully',
                'withdrawal_id': withdrawal.id,
                'reference': transfer_result['data']['reference'],
                'method': withdrawal_method
            })
        else:
            return Response({'error': 'Failed to initiate transfer'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f'Withdrawal error: {e}')
        import traceback
        traceback.print_exc()
        return Response({'error': f'Withdrawal error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_banks(request):
    """Get list of supported banks and mobile money providers"""
    try:
        result = paystack.list_banks('kenya')
        
        if result and result.get('status'):
            banks = result['data']
            
            # Add M-Pesa as a mobile money option
            mobile_money_providers = [
                {
                    'id': 'mpesa',
                    'name': 'M-Pesa',
                    'code': 'MPesa',
                    'type': 'mobile_money',
                    'currency': 'KES'
                }
            ]
            
            # Separate banks and mobile money
            bank_list = [bank for bank in banks if bank.get('type') != 'mobile_money']
            mobile_money_list = [bank for bank in banks if bank.get('type') == 'mobile_money'] + mobile_money_providers
            
            return Response({
                'status': 'success',
                'data': {
                    'banks': bank_list,
                    'mobile_money': mobile_money_list,
                    'all': banks + mobile_money_providers
                }
            })
        else:
            return Response({'error': 'Failed to fetch banks'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f'Banks list error: {e}')
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_mobile_money_providers(request):
    """Get list of mobile money providers for Kenya"""
    try:
        providers = [
            {
                'id': 'mpesa',
                'name': 'M-Pesa',
                'code': 'MPesa',
                'type': 'mobile_money',
                'currency': 'KES',
                'description': 'Safaricom M-Pesa mobile money'
            },
            {
                'id': 'airtel_money',
                'name': 'Airtel Money',
                'code': 'AirtelMoney',
                'type': 'mobile_money',
                'currency': 'KES',
                'description': 'Airtel Money mobile money'
            }
        ]
        
        return Response({
            'status': 'success',
            'data': providers
        })
        
    except Exception as e:
        logger.error(f'Mobile money providers error: {e}')
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_payment_fees(request):
    """Calculate payment fees for a given amount"""
    try:
        amount = request.data.get('amount')
        hours_worked = request.data.get('hours_worked')
        hourly_rate = request.data.get('hourly_rate')
        
        if not amount and not (hours_worked and hourly_rate):
            return Response({'error': 'Amount or hourly details required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate base amount
        if hours_worked and hourly_rate:
            base_amount = Decimal(str(hours_worked)) * Decimal(str(hourly_rate))
        else:
            base_amount = Decimal(str(amount))
        
        # Calculate fees
        client_fee = base_amount * CLIENT_FEE_PERCENTAGE  # 2.5% from client
        processing_fee = PROCESSING_FEE_KES
        total_amount = base_amount + client_fee + processing_fee
        
        return Response({
            'status': 'success',
            'breakdown': {
                'base_amount': float(base_amount),
                'client_fee': float(client_fee),
                'client_fee_percentage': float(CLIENT_FEE_PERCENTAGE * 100),
                'freelancer_fee_percentage': float(FREELANCER_FEE_PERCENTAGE * 100),
                'processing_fee': float(processing_fee),
                'total_amount': float(total_amount),
                'currency': 'KES'
            }
        })
        
    except Exception as e:
        logger.error(f'Fee calculation error: {e}')
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@require_http_methods(["POST"])
def paystack_webhook(request):
    """Handle Paystack webhooks with enhanced processing"""
    try:
        # Verify webhook signature
        signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE')
        if not signature:
            return JsonResponse({'error': 'No signature provided'}, status=400)
        
        # Compute expected signature
        expected_signature = hmac.new(
            PAYSTACK_SECRET_KEY.encode('utf-8'),
            request.body,
            hashlib.sha512
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            return JsonResponse({'error': 'Invalid signature'}, status=400)
        
        # Parse webhook data
        data = json.loads(request.body)
        event = data.get('event')
        
        if event == 'charge.success':
            # Handle successful payment
            reference = data['data']['reference']
            amount = Decimal(str(data['data']['amount'])) / 100  # Convert from cents
            metadata = data['data'].get('metadata', {})
            
            # Handle platform fee distribution
            platform_fee = Decimal(metadata.get('platform_fee', '0'))
            processing_fee = Decimal(metadata.get('processing_fee', '0'))
            base_amount = Decimal(metadata.get('base_amount', '0'))
            
            # Update order or job payment status
            payment_type = metadata.get('payment_type', 'gig')
            
            if payment_type == 'gig' and metadata.get('order_id'):
                try:
                    order = Order.objects.get(payment_reference=reference)
                    if order.payment_status == 'pending':
                        order.payment_status = 'paid'
                        order.status = 'in_progress'
                        order.is_paid = True
                        order.save()
                        
                        # Update freelancer's escrow balance (convert KES to USD for dashboard)
                        freelancer_profile, created = UserProfile.objects.get_or_create(user=order.freelancer)
                        usd_amount = convert_kes_to_usd(base_amount)
                        freelancer_profile.escrow_balance += usd_amount
                        freelancer_profile.save()
                        
                        logger.info(f'Order {order.id} payment processed: {base_amount} KES to escrow')
                        
                except Order.DoesNotExist:
                    logger.error(f'Order not found for reference: {reference}')
            
            # Record platform fees
            if platform_fee > 0 or processing_fee > 0:
                total_fees = platform_fee + processing_fee
                Transaction.objects.create(
                    user_id=1,  # Platform account
                    transaction_type='fee',
                    amount=total_fees,
                    description=f'Platform fees for {reference}',
                    reference=f'{reference}_platform_fees',
                    status='completed'
                )
                logger.info(f'Platform fees recorded: {total_fees} KES for {reference}')
        
        elif event == 'transfer.success':
            # Handle successful withdrawal
            reference = data['data']['reference']
            
            try:
                from .models import Withdrawal
                withdrawal = Withdrawal.objects.get(reference=reference)
                withdrawal.status = 'completed'
                withdrawal.processed_at = datetime.now()
                withdrawal.save()
                
                # Update transaction status
                Transaction.objects.filter(reference=reference).update(status='completed')
                
                logger.info(f'Withdrawal {withdrawal.id} completed successfully')
                
            except Withdrawal.DoesNotExist:
                logger.error(f'Withdrawal not found for reference: {reference}')
            
        elif event == 'transfer.failed':
            # Handle failed withdrawal
            reference = data['data']['reference']
            
            try:
                from .models import Withdrawal
                withdrawal = Withdrawal.objects.get(reference=reference)
                withdrawal.status = 'failed'
                withdrawal.save()
                
                # Refund user's balance
                user_profile, created = UserProfile.objects.get_or_create(user=withdrawal.user)
                user_profile.available_balance += withdrawal.amount
                user_profile.save()
                
                # Update transaction status
                Transaction.objects.filter(reference=reference).update(status='failed')
                
                logger.info(f'Withdrawal {withdrawal.id} failed, balance refunded')
                
            except Withdrawal.DoesNotExist:
                logger.error(f'Withdrawal not found for reference: {reference}')
            
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        logger.error(f'Webhook error: {e}')
        return JsonResponse({'error': 'Internal server error'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def release_escrow(request):
    """Release escrow funds when order is completed"""
    try:
        order_id = request.data.get('order_id')
        
        if not order_id:
            return Response({'error': 'Order ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            order = Order.objects.get(id=order_id, client=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if order.status != 'delivered':
            return Response({'error': 'Order must be delivered before releasing escrow'}, status=status.HTTP_400_BAD_REQUEST)
        
        if order.payment_status != 'paid':
            return Response({'error': 'Order payment not confirmed'}, status=status.HTTP_400_BAD_REQUEST)
        
        if order.escrow_released:
            return Response({'error': 'Escrow already released'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate the actual amount to release (base amount, not including fees)
        base_amount = order.price  # Original gig price without platform fees
        
        # Release escrow funds
        order.status = 'completed'
        order.escrow_released = True
        order.completed_at = datetime.now()
        order.save()
        
        # Update freelancer's balances (convert KES to USD for dashboard)
        freelancer_profile, created = UserProfile.objects.get_or_create(user=order.freelancer)
        usd_amount = convert_kes_to_usd(base_amount)
        freelancer_profile.escrow_balance -= usd_amount
        freelancer_profile.available_balance += usd_amount
        freelancer_profile.total_earnings += usd_amount
        freelancer_profile.save()
        
        # Create transaction record for escrow release
        Transaction.objects.create(
            user=order.freelancer,
            transaction_type='payment',
            amount=base_amount,
            description=f'Escrow released for completed order: {order.title}',
            reference=f'escrow_release_{order.id}_{datetime.now().strftime("%Y%m%d%H%M%S")}',
            status='completed',
            order=order
        )
        
        return Response({
            'status': 'success',
            'message': 'Escrow funds released successfully',
            'amount_released': float(base_amount)
        })
        
    except Exception as e:
        logger.error(f'Escrow release error: {e}')
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)