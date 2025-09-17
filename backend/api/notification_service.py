from django.contrib.auth.models import User
from .models import Notification, NotificationPreference, NotificationTemplate
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """Enhanced notification service with preferences and templates"""
    
    @staticmethod
    def create_notification(user, title, message, notification_type='system', action_url='', related_object_id=None):
        """Create a notification for a user"""
        try:
            notification = Notification.objects.create(
                user=user,
                title=title,
                message=message,
                notification_type=notification_type,
                action_url=action_url,
                related_object_id=related_object_id
            )
            return notification
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")
            return None
    
    @staticmethod
    def send_order_notification(order, status_change, message=''):
        """Send order-related notifications"""
        try:
            if status_change == 'created':
                # Notify freelancer
                NotificationService.create_notification(
                    user=order.freelancer,
                    title=f"New Order: {order.title}",
                    message=f"You received a new order from {order.client.get_full_name() or order.client.username}",
                    notification_type='order',
                    action_url=f'/freelancer-orders.html',
                    related_object_id=order.id
                )
            
            elif status_change == 'in_progress':
                # Notify client
                NotificationService.create_notification(
                    user=order.client,
                    title=f"Order Started: {order.title}",
                    message=f"Work has begun on your order. {message}",
                    notification_type='order',
                    action_url=f'/order-details.html?id={order.id}',
                    related_object_id=order.id
                )
            
            elif status_change == 'delivered':
                # Notify client
                NotificationService.create_notification(
                    user=order.client,
                    title=f"Order Delivered: {order.title}",
                    message=f"Your order has been delivered and is ready for review. {message}",
                    notification_type='order',
                    action_url=f'/order-details.html?id={order.id}',
                    related_object_id=order.id
                )
            
            elif status_change == 'completed':
                # Notify freelancer
                NotificationService.create_notification(
                    user=order.freelancer,
                    title=f"Order Completed: {order.title}",
                    message=f"Your order has been marked as completed. Payment will be released.",
                    notification_type='order',
                    action_url=f'/freelancer-orders.html',
                    related_object_id=order.id
                )
                
        except Exception as e:
            logger.error(f"Failed to send order notification: {e}")
    
    @staticmethod
    def send_proposal_notification(proposal, action):
        """Send proposal-related notifications"""
        try:
            if action == 'created':
                # Notify job client
                NotificationService.create_notification(
                    user=proposal.job.client,
                    title=f"New Proposal: {proposal.job.title}",
                    message=f"You received a new proposal from {proposal.freelancer.get_full_name() or proposal.freelancer.username}",
                    notification_type='proposal',
                    action_url=f'/job-details.html?id={proposal.job.id}',
                    related_object_id=proposal.id
                )
            
            elif action == 'accepted':
                # Notify freelancer
                NotificationService.create_notification(
                    user=proposal.freelancer,
                    title=f"Proposal Accepted: {proposal.job.title}",
                    message=f"Congratulations! Your proposal has been accepted.",
                    notification_type='proposal',
                    action_url=f'/my-proposals.html',
                    related_object_id=proposal.id
                )
            
            elif action == 'rejected':
                # Notify freelancer
                NotificationService.create_notification(
                    user=proposal.freelancer,
                    title=f"Proposal Update: {proposal.job.title}",
                    message=f"Your proposal was not selected for this project.",
                    notification_type='proposal',
                    action_url=f'/my-proposals.html',
                    related_object_id=proposal.id
                )
                
        except Exception as e:
            logger.error(f"Failed to send proposal notification: {e}")
    
    @staticmethod
    def send_message_notification(message):
        """Send message notifications to conversation participants"""
        try:
            conversation = message.conversation
            sender = message.sender
            
            # Notify all participants except sender
            for participant in conversation.participants.exclude(id=sender.id):
                NotificationService.create_notification(
                    user=participant,
                    title=f"New Message from {sender.get_full_name() or sender.username}",
                    message=message.content[:100] + ('...' if len(message.content) > 100 else ''),
                    notification_type='message',
                    action_url=f'/messages.html?conversation={conversation.id}',
                    related_object_id=message.id
                )
                
        except Exception as e:
            logger.error(f"Failed to send message notification: {e}")
    
    @staticmethod
    def send_payment_notification(user, amount, payment_type='received'):
        """Send payment-related notifications"""
        try:
            if payment_type == 'received':
                title = "Payment Received"
                message = f"You received a payment of KES {amount:.2f}"
                action_url = '/transactions.html'
            elif payment_type == 'sent':
                title = "Payment Sent"
                message = f"Your payment of KES {amount:.2f} has been processed"
                action_url = '/transactions.html'
            elif payment_type == 'withdrawal':
                title = "Withdrawal Processed"
                message = f"Your withdrawal of KES {amount:.2f} has been processed"
                action_url = '/transactions.html'
            
            NotificationService.create_notification(
                user=user,
                title=title,
                message=message,
                notification_type='payment',
                action_url=action_url
            )
            
        except Exception as e:
            logger.error(f"Failed to send payment notification: {e}")
    
    @staticmethod
    def send_system_notification(users, title, message):
        """Send system notifications to multiple users"""
        try:
            notifications_created = 0
            for user in users:
                notification = NotificationService.create_notification(
                    user=user,
                    title=title,
                    message=message,
                    notification_type='system'
                )
                if notification:
                    notifications_created += 1
            
            return notifications_created
            
        except Exception as e:
            logger.error(f"Failed to send system notifications: {e}")
            return 0
    
    @staticmethod
    def send_verification_notification(user, status, message=''):
        """Send verification-related notifications"""
        try:
            if status == 'submitted':
                title = "Verification Request Submitted"
                message = "Your identity verification request has been submitted and is under review. You'll be notified once it's processed."
                action_url = '/verify'
            elif status == 'approved':
                title = "Verification Approved"
                message = f"Congratulations! Your identity verification has been approved. You now have a verified badge on your profile. {message}"
                action_url = '/profile'
            elif status == 'rejected':
                title = "Verification Rejected"
                message = f"Your identity verification request has been rejected. {message} You can submit a new request with updated documents."
                action_url = '/verify'
            elif status == 'pending_review':
                title = "Verification Under Review"
                message = "Your verification documents are currently being reviewed by our team. This process typically takes 1-3 business days."
                action_url = '/verify'
            
            NotificationService.create_notification(
                user=user,
                title=title,
                message=message,
                notification_type='verification',
                action_url=action_url
            )
            
        except Exception as e:
            logger.error(f"Failed to send verification notification: {e}")
    
    @staticmethod
    def send_welcome_notifications(user):
        """Send welcome notifications to new users"""
        try:
            # Welcome notification
            NotificationService.create_notification(
                user=user,
                title="Welcome to Neurolancer! 🎉",
                message="Welcome to the premier AI freelance marketplace! We're excited to have you join our community of talented professionals.",
                notification_type='system',
                action_url='/dashboard'
            )
            
            # Complete profile notification
            NotificationService.create_notification(
                user=user,
                title="Complete Your Profile",
                message="Complete your profile to unlock all features and start connecting with clients or freelancers. Add your skills, experience, and portfolio.",
                notification_type='system',
                action_url='/auth/complete-profile'
            )
            
            # Browse opportunities notification
            NotificationService.create_notification(
                user=user,
                title="Explore AI Opportunities",
                message="Discover amazing AI projects and gigs waiting for your expertise. Browse jobs in Machine Learning, NLP, Computer Vision, and more!",
                notification_type='system',
                action_url='/browse'
            )
            
            # Verification reminder
            NotificationService.create_notification(
                user=user,
                title="Verify Your Identity",
                message="Get verified to build trust with clients and unlock premium features. Verified users get 3x more project invitations!",
                notification_type='system',
                action_url='/verify'
            )
            
            logger.info(f"Welcome notifications sent to {user.username}")
            
        except Exception as e:
            logger.error(f"Failed to send welcome notifications: {e}")
    
    @staticmethod
    def send_new_user_setup(user):
        """Complete new user setup with email and notifications"""
        try:
            from .email_service import EmailService
            
            # Send welcome email
            EmailService.send_welcome_email(user)
            
            # Send welcome notifications
            NotificationService.send_welcome_notifications(user)
            
            # Create default notification preferences
            NotificationService.get_default_preferences(user)
            
            logger.info(f"New user setup completed for {user.username}")
            
        except Exception as e:
            logger.error(f"Failed to complete new user setup: {e}")
    
    @staticmethod
    def get_default_preferences(user):
        """Create default notification preferences for user"""
        try:
            categories = [
                'order_updates', 'messages', 'job_alerts', 'system_notifications',
                'proposals', 'payments', 'reviews', 'verification'
            ]
            
            delivery_methods = ['in_app', 'email']
            
            for category in categories:
                for method in delivery_methods:
                    NotificationPreference.objects.get_or_create(
                        user=user,
                        category=category,
                        delivery_method=method,
                        defaults={
                            'is_enabled': True,
                            'frequency': 'instant'
                        }
                    )
                    
        except Exception as e:
            logger.error(f"Failed to create default preferences: {e}")
    
    @staticmethod
    def check_user_preferences(user, notification_type, delivery_method='in_app'):
        """Check if user wants to receive this type of notification"""
        try:
            preference = NotificationPreference.objects.filter(
                user=user,
                category=notification_type,
                delivery_method=delivery_method
            ).first()
            
            if preference:
                return preference.is_enabled
            
            # Default to enabled if no preference set
            return True
            
        except Exception as e:
            logger.error(f"Failed to check user preferences: {e}")
            return True
    
    @staticmethod
    def mark_notifications_read(user, notification_ids=None):
        """Mark notifications as read"""
        try:
            queryset = Notification.objects.filter(user=user, is_read=False)
            
            if notification_ids:
                queryset = queryset.filter(id__in=notification_ids)
            
            updated = queryset.update(is_read=True)
            return updated
            
        except Exception as e:
            logger.error(f"Failed to mark notifications as read: {e}")
            return 0
    
    @staticmethod
    def get_unread_count(user):
        """Get count of unread notifications for user"""
        try:
            return Notification.objects.filter(user=user, is_read=False).count()
        except Exception as e:
            logger.error(f"Failed to get unread count: {e}")
            return 0
    
    @staticmethod
    def cleanup_old_notifications(days=30):
        """Clean up old read notifications"""
        try:
            from datetime import timedelta
            cutoff_date = timezone.now() - timedelta(days=days)
            
            deleted_count = Notification.objects.filter(
                is_read=True,
                created_at__lt=cutoff_date
            ).delete()[0]
            
            logger.info(f"Cleaned up {deleted_count} old notifications")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup notifications: {e}")
            return 0