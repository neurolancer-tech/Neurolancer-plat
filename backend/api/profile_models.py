from django.db import models
from django.contrib.auth.models import User
from .models import UserProfile

class FreelancerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='freelancer_profile')
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='freelancer_profiles')
    
    # Professional Information
    title = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    availability = models.CharField(max_length=50, choices=[
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('freelance', 'Freelance')
    ], default='freelance')
    
    # Skills and Experience
    skills = models.TextField(blank=True, help_text="Comma-separated skills")
    experience_years = models.IntegerField(default=0)
    portfolio_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    
    # Ratings and Stats
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.IntegerField(default=0)
    completed_projects = models.IntegerField(default=0)
    response_time = models.CharField(max_length=50, default='Within 24 hours')
    
    # Profile Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'freelancer_profiles'
        
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - Freelancer Profile"

class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile')
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='client_profiles')
    
    # Company Information
    company_name = models.CharField(max_length=200, blank=True)
    company_size = models.CharField(max_length=50, choices=[
        ('1-10', '1-10 employees'),
        ('11-50', '11-50 employees'),
        ('51-200', '51-200 employees'),
        ('201-500', '201-500 employees'),
        ('500+', '500+ employees')
    ], blank=True)
    industry = models.CharField(max_length=100, blank=True)
    website_url = models.URLField(blank=True)
    
    # Project Preferences
    typical_budget = models.CharField(max_length=50, choices=[
        ('under_1k', 'Under $1,000'),
        ('1k_5k', '$1,000 - $5,000'),
        ('5k_10k', '$5,000 - $10,000'),
        ('10k_25k', '$10,000 - $25,000'),
        ('25k_plus', '$25,000+')
    ], blank=True)
    project_types = models.TextField(blank=True, help_text="Types of projects typically posted")
    
    # Client Stats
    total_projects_posted = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    avg_rating_given = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    
    # Profile Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'client_profiles'
        
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - Client Profile"