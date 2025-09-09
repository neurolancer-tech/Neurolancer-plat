from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    NewsletterSubscriber, Newsletter, NewsletterSendLog, 
    NewsletterTemplate, NewsletterContent
)

class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = [
            'id', 'email', 'first_name', 'last_name', 'status', 'source',
            'interests', 'user_type_preference', 'subscribed_at', 'email_verified',
            'email_open_count', 'email_click_count'
        ]
        read_only_fields = ['id', 'subscribed_at', 'email_open_count', 'email_click_count']

class NewsletterSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Newsletter
        fields = [
            'id', 'title', 'subject', 'newsletter_type', 'content', 'plain_text_content',
            'preview_text', 'header_image', 'header_image_url', 'target_audience',
            'custom_filter', 'status', 'created_by', 'created_by_name', 'scheduled_at',
            'sent_at', 'total_recipients', 'total_sent', 'total_delivered',
            'total_opened', 'total_clicked', 'total_bounced', 'total_unsubscribed',
            'open_rate', 'click_rate', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_by_name', 'sent_at', 'total_recipients',
            'total_sent', 'total_delivered', 'total_opened', 'total_clicked',
            'total_bounced', 'total_unsubscribed', 'open_rate', 'click_rate',
            'created_at', 'updated_at'
        ]

class NewsletterListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Newsletter
        fields = [
            'id', 'title', 'subject', 'newsletter_type', 'status', 'created_by_name',
            'scheduled_at', 'sent_at', 'total_recipients', 'total_opened',
            'total_clicked', 'open_rate', 'click_rate', 'created_at'
        ]

class NewsletterSendLogSerializer(serializers.ModelSerializer):
    subscriber_email = serializers.CharField(source='subscriber.email', read_only=True)
    newsletter_title = serializers.CharField(source='newsletter.title', read_only=True)
    
    class Meta:
        model = NewsletterSendLog
        fields = [
            'id', 'newsletter', 'newsletter_title', 'subscriber', 'subscriber_email',
            'status', 'sent_at', 'delivered_at', 'opened_at', 'clicked_at',
            'bounced_at', 'error_message', 'tracking_id'
        ]

class NewsletterTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = NewsletterTemplate
        fields = [
            'id', 'name', 'template_type', 'description', 'html_content',
            'css_styles', 'thumbnail', 'is_active', 'is_default',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'created_at', 'updated_at']

class NewsletterContentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    
    class Meta:
        model = NewsletterContent
        fields = [
            'id', 'title', 'content_type', 'summary', 'full_content',
            'image', 'image_url', 'link_url', 'link_text', 'is_featured',
            'is_published', 'publish_date', 'author', 'author_name',
            'tags', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'author_name', 'created_at', 'updated_at']



class NewsletterSubscriptionSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    interests = serializers.CharField(required=False, allow_blank=True)
    user_type_preference = serializers.ChoiceField(
        choices=[
            ('all', 'All Content'),
            ('client', 'Client-focused Content'),
            ('freelancer', 'Freelancer-focused Content'),
            ('learning', 'Learning & Development'),
            ('platform_updates', 'Platform Updates'),
        ],
        default='all'
    )
    source = serializers.CharField(default='website')