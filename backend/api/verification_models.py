from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class VerificationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verifying', 'Verifying'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('invalid', 'Invalid'),
    ]
    
    DOCUMENT_TYPES = [
        ('id_card', 'National ID Card'),
        ('passport', 'Passport'),
        ('drivers_license', 'Driver\'s License'),
        ('certificate', 'Professional Certificate'),
        ('portfolio', 'Portfolio Link'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Document uploads
    id_document = models.FileField(upload_to='verification/documents/', null=True, blank=True)
    id_document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, null=True, blank=True)
    
    secondary_document = models.FileField(upload_to='verification/documents/', null=True, blank=True)
    secondary_document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, null=True, blank=True)
    
    # Professional verification
    certificates = models.FileField(upload_to='verification/certificates/', null=True, blank=True)
    portfolio_link = models.URLField(max_length=500, null=True, blank=True)
    linkedin_profile = models.URLField(max_length=500, null=True, blank=True)
    
    # Additional info
    full_name = models.CharField(max_length=200)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    
    # Admin review
    admin_notes = models.TextField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_verifications')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Verification Request - {self.user.username} ({self.status})"
    
    def save(self, *args, **kwargs):
        if self.pk and self.status in ['verified', 'rejected'] and not self.reviewed_at:
            self.reviewed_at = timezone.now()
        super().save(*args, **kwargs)

class VerificationBadge(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification_badge')
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_level = models.CharField(max_length=20, choices=[
        ('basic', 'Basic'),
        ('professional', 'Professional'),
        ('expert', 'Expert'),
    ], default='basic')
    
    class Meta:
        db_table = 'verification_badge'
        
    def __str__(self):
        return f"{self.user.username} - {'Verified' if self.is_verified else 'Not Verified'}"