from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Gig, Job, Order, UserProfile

class Report(models.Model):
    REPORT_TYPES = (
        ('gig', 'Gig Report'),
        ('job', 'Job Report'),
        ('freelancer', 'Freelancer Report'),
        ('client', 'Client Report'),
        ('order', 'Order Report'),
        ('message', 'Message Report'),
        ('general', 'General Report'),
    )
    
    REPORT_CATEGORIES = (
        ('inappropriate_content', 'Inappropriate Content'),
        ('spam', 'Spam'),
        ('fraud', 'Fraud/Scam'),
        ('harassment', 'Harassment'),
        ('copyright', 'Copyright Violation'),
        ('fake_profile', 'Fake Profile'),
        ('poor_quality', 'Poor Quality Work'),
        ('payment_issue', 'Payment Issue'),
        ('communication_issue', 'Communication Issue'),
        ('other', 'Other'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('investigating', 'Under Investigation'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
        ('escalated', 'Escalated'),
    )
    
    SEVERITY_LEVELS = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )
    
    # Reporter information
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='filed_reports')
    
    # Report details
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    category = models.CharField(max_length=30, choices=REPORT_CATEGORIES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Reported content/user
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reports', null=True, blank=True)
    reported_gig = models.ForeignKey(Gig, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    reported_job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    reported_order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    
    # Additional context
    content_url = models.URLField(blank=True, help_text="URL of the reported content")
    evidence_file = models.FileField(upload_to='report_evidence/', blank=True, null=True)
    
    # Status and management
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS, default='medium')
    
    # Admin handling
    assigned_admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_reports')
    admin_notes = models.TextField(blank=True)
    resolution_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['reported_user', 'status']),
            models.Index(fields=['report_type', 'category']),
        ]
    
    def __str__(self):
        return f"Report #{self.id} - {self.title}"
    
    def get_reported_content_details(self):
        """Get details of the reported content"""
        if self.reported_gig:
            return {
                'type': 'gig',
                'title': self.reported_gig.title,
                'id': self.reported_gig.id,
                'owner': self.reported_gig.freelancer,
                'url': f'/gigs/{self.reported_gig.id}'
            }
        elif self.reported_job:
            return {
                'type': 'job',
                'title': self.reported_job.title,
                'id': self.reported_job.id,
                'owner': self.reported_job.client,
                'url': f'/jobs/{self.reported_job.id}'
            }
        elif self.reported_order:
            return {
                'type': 'order',
                'title': self.reported_order.title,
                'id': self.reported_order.id,
                'owner': self.reported_order.freelancer,
                'url': f'/orders/{self.reported_order.id}'
            }
        elif self.reported_user:
            return {
                'type': 'user',
                'title': f"{self.reported_user.get_full_name() or self.reported_user.username}",
                'id': self.reported_user.id,
                'owner': self.reported_user,
                'url': f'/profile/{self.reported_user.id}'
            }
        return None

class ReportAction(models.Model):
    ACTION_TYPES = (
        ('warning', 'Warning Sent'),
        ('content_removal', 'Content Removed'),
        ('account_suspension', 'Account Suspended'),
        ('account_deactivation', 'Account Deactivated'),
        ('custom_message', 'Custom Message Sent'),
        ('no_action', 'No Action Required'),
        ('escalated', 'Escalated to Senior Admin'),
    )
    
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='actions')
    action_type = models.CharField(max_length=25, choices=ACTION_TYPES)
    action_description = models.TextField()
    custom_message = models.TextField(blank=True, help_text="Custom message sent to reported user")
    
    # Admin who took action
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='report_actions_taken')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.action_type} for Report #{self.report.id}"

class UserReportStats(models.Model):
    """Track report statistics for users"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='report_stats')
    
    # Report counts
    total_reports_received = models.IntegerField(default=0)
    reports_last_30_days = models.IntegerField(default=0)
    reports_last_7_days = models.IntegerField(default=0)
    
    # Severity tracking
    low_severity_reports = models.IntegerField(default=0)
    medium_severity_reports = models.IntegerField(default=0)
    high_severity_reports = models.IntegerField(default=0)
    critical_severity_reports = models.IntegerField(default=0)
    
    # Actions taken
    warnings_received = models.IntegerField(default=0)
    content_removals = models.IntegerField(default=0)
    suspensions_count = models.IntegerField(default=0)
    
    # Status
    is_flagged = models.BooleanField(default=False, help_text="User flagged for review")
    risk_level = models.CharField(max_length=10, choices=[
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
        ('critical', 'Critical Risk'),
    ], default='low')
    
    # Timestamps
    last_report_date = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Report Stats for {self.user.username}"
    
    def calculate_risk_level(self):
        """Calculate risk level based on reports"""
        if self.critical_severity_reports > 0 or self.total_reports_received >= 10:
            return 'critical'
        elif self.high_severity_reports >= 2 or self.total_reports_received >= 5:
            return 'high'
        elif self.medium_severity_reports >= 3 or self.total_reports_received >= 3:
            return 'medium'
        else:
            return 'low'
    
    def update_stats(self):
        """Update statistics from reports"""
        from datetime import timedelta
        now = timezone.now()
        
        # Get all reports for this user
        reports = Report.objects.filter(reported_user=self.user)
        
        # Update counts
        self.total_reports_received = reports.count()
        self.reports_last_30_days = reports.filter(
            created_at__gte=now - timedelta(days=30)
        ).count()
        self.reports_last_7_days = reports.filter(
            created_at__gte=now - timedelta(days=7)
        ).count()
        
        # Update severity counts
        self.low_severity_reports = reports.filter(severity='low').count()
        self.medium_severity_reports = reports.filter(severity='medium').count()
        self.high_severity_reports = reports.filter(severity='high').count()
        self.critical_severity_reports = reports.filter(severity='critical').count()
        
        # Update actions
        actions = ReportAction.objects.filter(report__reported_user=self.user)
        self.warnings_received = actions.filter(action_type='warning').count()
        self.content_removals = actions.filter(action_type='content_removal').count()
        self.suspensions_count = actions.filter(action_type='account_suspension').count()
        
        # Update risk level
        self.risk_level = self.calculate_risk_level()
        self.is_flagged = self.risk_level in ['high', 'critical']
        
        # Update last report date
        latest_report = reports.order_by('-created_at').first()
        if latest_report:
            self.last_report_date = latest_report.created_at
        
        self.save()