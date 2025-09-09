from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

# Newsletter System Models
class NewsletterSubscriber(models.Model):
    SUBSCRIPTION_STATUS = (
        ('active', 'Active'),
        ('unsubscribed', 'Unsubscribed'),
        ('bounced', 'Bounced'),
        ('complained', 'Complained'),
    )
    
    SUBSCRIPTION_SOURCES = (
        ('website', 'Website Footer'),
        ('registration', 'User Registration'),
        ('checkout', 'Order Checkout'),
        ('profile', 'User Profile'),
        ('manual', 'Manual Addition'),
        ('import', 'Bulk Import'),
    )
    
    email = models.EmailField(unique=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='newsletter_subscription')
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=15, choices=SUBSCRIPTION_STATUS, default='active')
    source = models.CharField(max_length=15, choices=SUBSCRIPTION_SOURCES, default='website')
    interests = models.TextField(blank=True, help_text="Comma-separated list of interests")
    user_type_preference = models.CharField(max_length=20, choices=[
        ('all', 'All Content'),
        ('client', 'Client-focused Content'),
        ('freelancer', 'Freelancer-focused Content'),
        ('learning', 'Learning & Development'),
        ('platform_updates', 'Platform Updates'),
    ], default='all')
    subscribed_at = models.DateTimeField(auto_now_add=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    unsubscribe_token = models.CharField(max_length=100, unique=True, blank=True)
    email_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=100, blank=True)
    verification_sent_at = models.DateTimeField(null=True, blank=True)
    last_email_sent = models.DateTimeField(null=True, blank=True)
    email_open_count = models.IntegerField(default=0)
    email_click_count = models.IntegerField(default=0)
    
    def save(self, *args, **kwargs):
        if not self.unsubscribe_token:
            import secrets
            self.unsubscribe_token = secrets.token_urlsafe(32)
        if not self.verification_token:
            import secrets
            self.verification_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.email} ({self.status})"
    
    class Meta:
        ordering = ['-subscribed_at']

class Newsletter(models.Model):
    NEWSLETTER_STATUS = (
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('cancelled', 'Cancelled'),
    )
    
    NEWSLETTER_TYPES = (
        ('weekly_digest', 'Weekly Digest'),
        ('platform_updates', 'Platform Updates'),
        ('featured_gigs', 'Featured Gigs'),
        ('learning_spotlight', 'Learning Spotlight'),
        ('success_stories', 'Success Stories'),
        ('tips_tricks', 'Tips & Tricks'),
        ('announcement', 'Special Announcement'),
        ('promotional', 'Promotional'),
    )
    
    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=200)
    newsletter_type = models.CharField(max_length=20, choices=NEWSLETTER_TYPES, default='weekly_digest')
    content = models.TextField(help_text="HTML content of the newsletter")
    plain_text_content = models.TextField(blank=True, help_text="Plain text version")
    preview_text = models.CharField(max_length=150, blank=True, help_text="Email preview text")
    header_image = models.ImageField(upload_to='newsletter_images/', blank=True, null=True)
    header_image_url = models.URLField(blank=True, null=True)
    target_audience = models.CharField(max_length=20, choices=[
        ('all', 'All Subscribers'),
        ('clients', 'Clients Only'),
        ('freelancers', 'Freelancers Only'),
        ('new_users', 'New Users (Last 30 days)'),
        ('active_users', 'Active Users'),
        ('custom', 'Custom Segment'),
    ], default='all')
    custom_filter = models.JSONField(default=dict, blank=True, help_text="Custom audience filter criteria")
    status = models.CharField(max_length=15, choices=NEWSLETTER_STATUS, default='draft')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_newsletters')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    total_recipients = models.IntegerField(default=0)
    total_sent = models.IntegerField(default=0)
    total_delivered = models.IntegerField(default=0)
    total_opened = models.IntegerField(default=0)
    total_clicked = models.IntegerField(default=0)
    total_bounced = models.IntegerField(default=0)
    total_unsubscribed = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} ({self.status})"
    
    @property
    def open_rate(self):
        if self.total_delivered > 0:
            return (self.total_opened / self.total_delivered) * 100
        return 0
    
    @property
    def click_rate(self):
        if self.total_delivered > 0:
            return (self.total_clicked / self.total_delivered) * 100
        return 0
    
    class Meta:
        ordering = ['-created_at']

class NewsletterSendLog(models.Model):
    SEND_STATUS = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('opened', 'Opened'),
        ('clicked', 'Clicked'),
        ('bounced', 'Bounced'),
        ('complained', 'Complained'),
        ('unsubscribed', 'Unsubscribed'),
        ('failed', 'Failed'),
    )
    
    newsletter = models.ForeignKey(Newsletter, on_delete=models.CASCADE, related_name='send_logs')
    subscriber = models.ForeignKey(NewsletterSubscriber, on_delete=models.CASCADE, related_name='email_logs')
    status = models.CharField(max_length=15, choices=SEND_STATUS, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    bounced_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    tracking_id = models.CharField(max_length=100, unique=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.tracking_id:
            import uuid
            self.tracking_id = str(uuid.uuid4())
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.newsletter.title} -> {self.subscriber.email} ({self.status})"
    
    class Meta:
        unique_together = ['newsletter', 'subscriber']
        ordering = ['-sent_at']

class NewsletterTemplate(models.Model):
    TEMPLATE_TYPES = (
        ('weekly_digest', 'Weekly Digest'),
        ('platform_updates', 'Platform Updates'),
        ('featured_content', 'Featured Content'),
        ('promotional', 'Promotional'),
        ('announcement', 'Announcement'),
        ('welcome', 'Welcome Email'),
        ('custom', 'Custom Template'),
    )
    
    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES)
    description = models.TextField(blank=True)
    html_content = models.TextField(help_text="HTML template with placeholders")
    css_styles = models.TextField(blank=True, help_text="Custom CSS styles")
    thumbnail = models.ImageField(upload_to='newsletter_templates/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='newsletter_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.template_type})"
    
    class Meta:
        ordering = ['name']

class NewsletterContent(models.Model):
    CONTENT_TYPES = (
        ('featured_gig', 'Featured Gig'),
        ('success_story', 'Success Story'),
        ('tip', 'Tip & Trick'),
        ('platform_update', 'Platform Update'),
        ('course_highlight', 'Course Highlight'),
        ('freelancer_spotlight', 'Freelancer Spotlight'),
        ('client_story', 'Client Story'),
        ('industry_news', 'Industry News'),
        ('custom', 'Custom Content'),
    )
    
    title = models.CharField(max_length=200)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    summary = models.TextField(help_text="Brief summary for newsletter inclusion")
    full_content = models.TextField()
    image = models.ImageField(upload_to='newsletter_content/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    link_url = models.URLField(blank=True, help_text="Call-to-action link")
    link_text = models.CharField(max_length=100, blank=True, default="Read More")
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
    publish_date = models.DateTimeField(null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='newsletter_content')
    tags = models.TextField(blank=True, help_text="Comma-separated tags")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} ({self.content_type})"
    
    class Meta:
        ordering = ['-created_at']

class NewsletterAnalytics(models.Model):
    newsletter = models.OneToOneField(Newsletter, on_delete=models.CASCADE, related_name='analytics')
    unique_opens = models.IntegerField(default=0)
    unique_clicks = models.IntegerField(default=0)
    forward_count = models.IntegerField(default=0)
    device_stats = models.JSONField(default=dict, help_text="Device breakdown (mobile, desktop, tablet)")
    location_stats = models.JSONField(default=dict, help_text="Geographic breakdown")
    time_stats = models.JSONField(default=dict, help_text="Open/click time analysis")
    link_clicks = models.JSONField(default=dict, help_text="Individual link click tracking")
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Analytics for {self.newsletter.title}"

class NewsletterCampaign(models.Model):
    CAMPAIGN_STATUS = (
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    newsletters = models.ManyToManyField(Newsletter, related_name='campaigns')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=CAMPAIGN_STATUS, default='active')
    target_metrics = models.JSONField(default=dict, help_text="Target open rates, click rates, etc.")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='newsletter_campaigns')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.status})"
    
    class Meta:
        ordering = ['-created_at']