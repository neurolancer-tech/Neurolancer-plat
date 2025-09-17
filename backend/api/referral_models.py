from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid
import string
import random

class ReferralSettings(models.Model):
    """Admin-controlled referral system settings"""
    
    # System toggles
    is_active = models.BooleanField(default=True, help_text="Enable/disable entire referral system")
    signup_bonus_enabled = models.BooleanField(default=True, help_text="Enable signup bonus for referrals")
    earnings_percentage_enabled = models.BooleanField(default=False, help_text="Enable percentage from referred user earnings")
    
    # Bonus amounts
    signup_bonus_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('5.00'),
        help_text="Amount referrer earns when someone signs up with their link"
    )
    
    # Earnings percentage
    earnings_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('2.00'),
        validators=[MinValueValidator(0), MaxValueValidator(50)],
        help_text="Percentage of referred user's earnings that referrer gets"
    )
    
    # Limits and restrictions
    max_referrals_per_user = models.IntegerField(default=100, help_text="Maximum referrals per user (0 = unlimited)")
    min_payout_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('10.00'),
        help_text="Minimum amount before referral earnings can be withdrawn"
    )
    
    # Time restrictions
    earnings_duration_days = models.IntegerField(
        default=365, help_text="How many days referrer earns from referred user (0 = forever)"
    )
    
    # Anti-fraud measures
    require_email_verification = models.BooleanField(default=True, help_text="Referred user must verify email")
    require_first_purchase = models.BooleanField(default=False, help_text="Referred user must make first purchase")
    min_account_age_hours = models.IntegerField(default=24, help_text="Minimum account age before earning referral bonus")
    
    # Metadata
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referral_settings_updates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Referral Settings"
        verbose_name_plural = "Referral Settings"
    
    def __str__(self):
        return f"Referral Settings (Updated: {self.updated_at})"
    
    @classmethod
    def get_settings(cls):
        """Get current referral settings, create default if none exist"""
        settings, created = cls.objects.get_or_create(
            id=1,
            defaults={
                'updated_by_id': 1,  # Assuming admin user ID is 1
            }
        )
        return settings

class ReferralCode(models.Model):
    """User referral codes"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referral_code')
    code = models.CharField(max_length=20, unique=True, db_index=True)
    
    # Statistics
    total_signups = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    pending_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    withdrawn_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Status
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_unique_code()
        super().save(*args, **kwargs)
    
    def generate_unique_code(self):
        """Generate unique referral code"""
        while True:
            # Use username + random string for better readability
            username_part = self.user.username[:6].upper()
            random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            code = f"{username_part}{random_part}"
            
            if not ReferralCode.objects.filter(code=code).exists():
                return code
    
    @property
    def referral_url(self):
        """Get full referral URL"""
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        return f"{frontend_url}/auth?ref={self.code}"
    
    def __str__(self):
        return f"{self.user.username} - {self.code}"

class Referral(models.Model):
    """Individual referral records"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals_made')
    referred_user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referral_info')
    referral_code = models.ForeignKey(ReferralCode, on_delete=models.CASCADE, related_name='referrals')
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Bonus tracking
    signup_bonus_paid = models.BooleanField(default=False)
    signup_bonus_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Fraud prevention
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamps
    signed_up_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    first_purchase_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['referrer', 'referred_user']
    
    def __str__(self):
        return f"{self.referrer.username} -> {self.referred_user.username}"

class ReferralEarning(models.Model):
    """Track earnings from referrals"""
    
    EARNING_TYPES = [
        ('signup_bonus', 'Signup Bonus'),
        ('earnings_percentage', 'Earnings Percentage'),
        ('bonus', 'Special Bonus'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]
    
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referral_earnings')
    referred_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_referral_earnings')
    referral = models.ForeignKey(Referral, on_delete=models.CASCADE, related_name='earnings')
    
    earning_type = models.CharField(max_length=20, choices=EARNING_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Source transaction (for percentage earnings)
    source_transaction_id = models.IntegerField(null=True, blank=True)
    source_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    percentage_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.referrer.username} earned ${self.amount} from {self.referred_user.username}"

class ReferralWithdrawal(models.Model):
    """Referral earnings withdrawals"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referral_withdrawals')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment details
    withdrawal_method = models.CharField(max_length=20, choices=[
        ('bank', 'Bank Transfer'),
        ('mpesa', 'M-Pesa'),
        ('paypal', 'PayPal'),
        ('balance', 'Add to Account Balance'),
    ], default='balance')
    
    account_details = models.JSONField(default=dict, help_text="Payment account details")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Processing info
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_referral_withdrawals')
    payment_reference = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - ${self.amount} ({self.status})"