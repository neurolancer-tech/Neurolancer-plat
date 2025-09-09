from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from datetime import datetime, timedelta
import secrets
import uuid

from .models import (
    NewsletterSubscriber, Newsletter, NewsletterSendLog, 
    NewsletterTemplate, NewsletterContent
)

class NewsletterService:
    """Service class for newsletter operations"""
    
    @staticmethod
    def create_subscriber(email, **kwargs):
        """Create or update newsletter subscriber"""
        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={
                'first_name': kwargs.get('first_name', ''),
                'last_name': kwargs.get('last_name', ''),
                'interests': kwargs.get('interests', ''),
                'user_type_preference': kwargs.get('user_type_preference', 'all'),
                'source': kwargs.get('source', 'website'),
                'status': 'active'
            }
        )
        
        if not created and subscriber.status != 'active':
            # Reactivate if previously unsubscribed
            subscriber.status = 'active'
            subscriber.unsubscribed_at = None
            subscriber.save()
        
        return subscriber, created
    
    @staticmethod
    def send_verification_email(subscriber):
        """Send email verification to subscriber"""
        verification_url = f"{settings.FRONTEND_URL}/newsletter/verify/{subscriber.verification_token}/"
        
        context = {
            'subscriber': subscriber,
            'verification_url': verification_url,
            'site_name': 'Neurolancer',
            'site_url': settings.FRONTEND_URL
        }
        
        subject = 'Confirm your Neurolancer newsletter subscription'
        
        # Plain text version
        text_content = f"""
Hi {subscriber.first_name or 'there'},

Thank you for subscribing to the Neurolancer newsletter! 

Please confirm your subscription by clicking the link below:
{verification_url}

If you didn't subscribe to our newsletter, please ignore this email.

Best regards,
The Neurolancer Team
        """
        
        # HTML version
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirm Your Newsletter Subscription</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🧠 Neurolancer</h1>
                <p style="color: #f0f0f0; margin: 10px 0 0 0;">AI Freelance Marketplace</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #2563eb; margin-top: 0;">Confirm Your Newsletter Subscription</h2>
                
                <p>Hi {subscriber.first_name or 'there'},</p>
                
                <p>Thank you for subscribing to the Neurolancer newsletter! You're about to join thousands of AI professionals getting exclusive insights and opportunities.</p>
                
                <p>Please confirm your subscription by clicking the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                        ✅ Confirm Subscription
                    </a>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2563eb; margin-top: 0;">What to Expect:</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>🚀 Weekly AI insights and trends</li>
                        <li>💼 Exclusive freelance opportunities</li>
                        <li>📚 Premium learning resources</li>
                        <li>🌟 Success stories from our community</li>
                    </ul>
                </div>
                
                <p style="font-size: 14px; color: #666;">If you didn't subscribe to our newsletter, please ignore this email.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #666; text-align: center;">
                    Best regards,<br>
                    <strong>The Neurolancer Team</strong><br>
                    <a href="{settings.FRONTEND_URL}" style="color: #2563eb;">Visit Neurolancer</a>
                </p>
            </div>
        </body>
        </html>
        """
        
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[subscriber.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            
            subscriber.verification_sent_at = timezone.now()
            subscriber.save()
            
            return True
        except Exception as e:
            print(f"Failed to send verification email: {e}")
            return False
    
    @staticmethod
    def send_newsletter(newsletter):
        """Send newsletter to all active subscribers"""
        if newsletter.status != 'draft':
            raise ValueError("Only draft newsletters can be sent")
        
        # Get target subscribers
        subscribers = NewsletterSubscriber.objects.filter(
            status='active',
            email_verified=True
        )
        
        # Apply audience filters
        if newsletter.target_audience == 'clients':
            subscribers = subscribers.filter(
                user_type_preference__in=['client', 'all']
            )
        elif newsletter.target_audience == 'freelancers':
            subscribers = subscribers.filter(
                user_type_preference__in=['freelancer', 'all']
            )
        elif newsletter.target_audience == 'new_users':
            thirty_days_ago = timezone.now() - timedelta(days=30)
            subscribers = subscribers.filter(subscribed_at__gte=thirty_days_ago)
        
        # Update newsletter status
        newsletter.status = 'sending'
        newsletter.total_recipients = subscribers.count()
        newsletter.save()
        
        sent_count = 0
        failed_count = 0
        
        for subscriber in subscribers:
            success = NewsletterService.send_newsletter_email(subscriber, newsletter)
            if success:
                sent_count += 1
            else:
                failed_count += 1
        
        # Update final status
        newsletter.status = 'sent'
        newsletter.sent_at = timezone.now()
        newsletter.total_sent = sent_count
        newsletter.save()
        
        return {
            'sent_count': sent_count,
            'failed_count': failed_count,
            'total_recipients': newsletter.total_recipients
        }
    
    @staticmethod
    def send_newsletter_email(subscriber, newsletter):
        """Send individual newsletter email"""
        try:
            # Create tracking log
            send_log = NewsletterSendLog.objects.create(
                newsletter=newsletter,
                subscriber=subscriber,
                status='pending'
            )
            
            # Prepare email content
            subject = newsletter.subject
            html_content = newsletter.content
            plain_content = newsletter.plain_text_content or "Please view this email in HTML format."
            
            # Add tracking and unsubscribe
            tracking_pixel = f'<img src="{settings.FRONTEND_URL}/api/newsletter/track/open/{send_log.tracking_id}/" width="1" height="1" style="display:none;">'
            unsubscribe_link = f'{settings.FRONTEND_URL}/newsletter/unsubscribe/{subscriber.unsubscribe_token}/'
            
            # Add footer to HTML content
            footer_html = f"""
            <div style="margin-top: 40px; padding: 20px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6;">
                <p style="margin: 0 0 10px 0;">You received this email because you subscribed to Neurolancer updates.</p>
                <p style="margin: 0;">
                    <a href="{unsubscribe_link}" style="color: #6c757d; text-decoration: underline;">Unsubscribe</a> | 
                    <a href="{settings.FRONTEND_URL}" style="color: #6c757d; text-decoration: underline;">Visit Neurolancer</a> |
                    <a href="{settings.FRONTEND_URL}/newsletter/preferences" style="color: #6c757d; text-decoration: underline;">Update Preferences</a>
                </p>
            </div>
            {tracking_pixel}
            """
            
            html_content += footer_html
            
            # Send email
            msg = EmailMultiAlternatives(
                subject=subject,
                body=plain_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[subscriber.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            
            # Update send log
            send_log.status = 'sent'
            send_log.sent_at = timezone.now()
            send_log.save()
            
            # Update subscriber
            subscriber.last_email_sent = timezone.now()
            subscriber.save()
            
            return True
            
        except Exception as e:
            # Update send log with error
            if 'send_log' in locals():
                send_log.status = 'failed'
                send_log.error_message = str(e)
                send_log.save()
            
            print(f"Failed to send newsletter to {subscriber.email}: {e}")
            return False
    
    @staticmethod
    def generate_weekly_digest():
        """Generate weekly digest newsletter content"""
        # Get featured content from the past week
        week_ago = timezone.now() - timedelta(days=7)
        
        # Get featured gigs
        from .models import Gig
        featured_gigs = Gig.objects.filter(
            is_active=True,
            created_at__gte=week_ago
        ).order_by('-rating', '-total_orders')[:3]
        
        # Get success stories (completed orders)
        from .models import Order
        success_stories = Order.objects.filter(
            status='completed',
            completed_at__gte=week_ago
        ).select_related('client', 'freelancer', 'gig')[:2]
        
        # Get newsletter content
        newsletter_content = NewsletterContent.objects.filter(
            is_published=True,
            content_type__in=['tip', 'platform_update', 'industry_news'],
            created_at__gte=week_ago
        )[:3]
        
        # Generate HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Neurolancer Weekly Digest</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🧠 Neurolancer Weekly</h1>
                <p style="color: #f0f0f0; margin: 10px 0 0 0;">Your AI Freelance Update</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #2563eb; margin-top: 0;">This Week in AI Freelancing</h2>
                
                <!-- Featured Gigs Section -->
                <div style="margin: 30px 0;">
                    <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">🚀 Featured Opportunities</h3>
        """
        
        for gig in featured_gigs:
            html_content += f"""
                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #2563eb;">{gig.title}</h4>
                        <p style="margin: 0 0 10px 0; color: #6b7280;">{gig.description[:150]}...</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #059669; font-weight: bold;">From ${gig.basic_price}</span>
                            <a href="{settings.FRONTEND_URL}/gigs/{gig.id}" style="background: #2563eb; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">View Details</a>
                        </div>
                    </div>
            """
        
        # Add newsletter content
        if newsletter_content:
            html_content += """
                </div>
                
                <!-- Newsletter Content Section -->
                <div style="margin: 30px 0;">
                    <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📚 This Week's Insights</h3>
            """
            
            for content in newsletter_content:
                html_content += f"""
                    <div style="border-left: 4px solid #2563eb; padding-left: 20px; margin: 20px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #1f2937;">{content.title}</h4>
                        <p style="margin: 0 0 10px 0; color: #6b7280;">{content.summary}</p>
                        {f'<a href="{content.link_url}" style="color: #2563eb; text-decoration: none; font-weight: bold;">{content.link_text} →</a>' if content.link_url else ''}
                    </div>
                """
        
        html_content += """
                </div>
                
                <!-- CTA Section -->
                <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #1f2937;">Ready to Start Your AI Journey?</h3>
                    <p style="margin: 0 0 20px 0; color: #6b7280;">Join thousands of professionals already earning with AI skills</p>
                    <a href="{settings.FRONTEND_URL}/auth" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Get Started Today</a>
                </div>
            </div>
        </body>
        </html>
        """
        
        return {
            'title': f'Neurolancer Weekly Digest - {timezone.now().strftime("%B %d, %Y")}',
            'subject': f'🧠 Your Weekly AI Opportunities - {timezone.now().strftime("%b %d")}',
            'content': html_content,
            'newsletter_type': 'weekly_digest'
        }
    
    @staticmethod
    def track_email_open(tracking_id):
        """Track email open event"""
        try:
            send_log = NewsletterSendLog.objects.get(tracking_id=tracking_id)
            
            if send_log.status == 'sent':
                send_log.status = 'opened'
                send_log.opened_at = timezone.now()
                send_log.save()
                
                # Update newsletter stats
                newsletter = send_log.newsletter
                newsletter.total_opened += 1
                newsletter.save()
                
                # Update subscriber stats
                subscriber = send_log.subscriber
                subscriber.email_open_count += 1
                subscriber.save()
            
            return True
        except NewsletterSendLog.DoesNotExist:
            return False