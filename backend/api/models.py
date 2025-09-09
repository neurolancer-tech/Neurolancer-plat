from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal

class UserProfile(models.Model):
    USER_TYPES = (
        ('client', 'Client'),
        ('freelancer', 'Freelancer'),
        ('both', 'Both'),
    )
    
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='client')
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True, null=True)
    email_verification_sent_at = models.DateTimeField(blank=True, null=True)
    password_reset_token = models.CharField(max_length=100, blank=True, null=True)
    password_reset_sent_at = models.DateTimeField(blank=True, null=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    avatar_type = models.CharField(max_length=10, choices=[('upload', 'Uploaded'), ('avatar', 'Avatar'), ('google', 'Google')], default='avatar')
    selected_avatar = models.CharField(max_length=50, default='user')
    google_photo_url = models.URLField(blank=True)
    skills = models.TextField(blank=True, help_text="Comma-separated list of skills")
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Personal Information
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)
    
    # Contact Details
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    github = models.URLField(blank=True)
    
    # Professional Information
    title = models.CharField(max_length=200, blank=True, help_text="Professional title")
    experience_years = models.IntegerField(blank=True, null=True)
    education = models.TextField(blank=True)
    certifications = models.TextField(blank=True)
    languages = models.TextField(blank=True, help_text="Comma-separated list of languages")
    
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    escrow_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    available_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Paystack Integration
    paystack_subaccount_code = models.CharField(max_length=100, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True)
    bank_code = models.CharField(max_length=10, blank=True)
    account_number = models.CharField(max_length=20, blank=True)
    account_name = models.CharField(max_length=100, blank=True)
    completed_gigs = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_reviews = models.IntegerField(default=0)
    likes_count = models.IntegerField(default=0)
    dislikes_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_avatar_url(self):
        if self.avatar_type == 'google' and self.google_photo_url:
            return self.google_photo_url
        elif self.avatar_type == 'upload' and self.profile_picture:
            return self.profile_picture.url
        else:
            return f'/avatars/{self.selected_avatar}.svg'
    
    def __str__(self):
        return f"{self.user.username} - {self.user_type}"

class ProfessionalDocument(models.Model):
    DOCUMENT_TYPES = (
        ('cv', 'CV/Resume'),
        ('portfolio', 'Portfolio'),
        ('certificate', 'Certificate'),
        ('degree', 'Degree'),
        ('license', 'License'),
        ('other', 'Other'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='professional_documents')
    name = models.CharField(max_length=200)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, default='other')
    file = models.FileField(upload_to='professional_documents/')
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True, help_text="Visible to clients on profile")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # For storing icon class names
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Gig(models.Model):
    PACKAGE_TYPES = (
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    )

    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gigs')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='gigs')
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to='gig_images/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True, help_text="External image URL")
    
    # Basic package
    basic_title = models.CharField(max_length=100)
    basic_description = models.TextField()
    basic_price = models.DecimalField(max_digits=10, decimal_places=2)
    basic_delivery_time = models.IntegerField(help_text="Delivery time in days")
    
    # Standard package
    standard_title = models.CharField(max_length=100, blank=True)
    standard_description = models.TextField(blank=True)
    standard_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    standard_delivery_time = models.IntegerField(blank=True, null=True, help_text="Delivery time in days")
    
    # Premium package
    premium_title = models.CharField(max_length=100, blank=True)
    premium_description = models.TextField(blank=True)
    premium_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    premium_delivery_time = models.IntegerField(blank=True, null=True, help_text="Delivery time in days")
    
    tags = models.TextField(blank=True, help_text="Comma-separated list of tags")
    is_active = models.BooleanField(default=True)
    total_orders = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_reviews = models.IntegerField(default=0)
    likes_count = models.IntegerField(default=0)
    dislikes_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Project(models.Model):
    PROJECT_STATUS = (
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=200)
    description = models.TextField()
    total_budget = models.DecimalField(max_digits=10, decimal_places=2)
    deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=PROJECT_STATUS, default='planning')
    category = models.CharField(max_length=100, blank=True)
    requirements = models.TextField(blank=True)
    conversation = models.OneToOneField('Conversation', on_delete=models.CASCADE, related_name='main_project', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Project: {self.title}"

class Task(models.Model):
    TASK_STATUS = (
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('review', 'Under Review'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    PRIORITY_LEVELS = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    deadline = models.DateTimeField()
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    status = models.CharField(max_length=15, choices=TASK_STATUS, default='pending')
    assigned_freelancer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    requirements = models.TextField(blank=True)
    skills_required = models.TextField(blank=True)
    progress = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Task: {self.title}"

class TaskProposal(models.Model):
    PROPOSAL_STATUS = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='proposals')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_proposals')
    message = models.TextField()
    proposed_budget = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=PROPOSAL_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['task', 'freelancer']
    
    def __str__(self):
        return f"Proposal for {self.task.title} by {self.freelancer.username}"

class Order(models.Model):
    ORDER_STATUS = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('in_progress', 'In Progress'),
        ('delivered', 'Delivered'),
        ('revision_requested', 'Revision Requested'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('disputed', 'Disputed'),
    )

    PACKAGE_TYPES = (
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    )

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_orders')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='freelancer_orders')
    gig = models.ForeignKey(Gig, on_delete=models.CASCADE, related_name='orders')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    package_type = models.CharField(max_length=10, choices=PACKAGE_TYPES)
    
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    delivery_time = models.IntegerField(help_text="Delivery time in days", null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='pending')
    requirements = models.TextField(blank=True, help_text="Client requirements for the order")
    progress_notes = models.TextField(blank=True, help_text="Freelancer progress updates")
    
    # Payment and escrow
    payment_id = models.CharField(max_length=100, blank=True)  # Paystack transaction reference
    payment_reference = models.CharField(max_length=100, blank=True)  # Paystack payment reference
    payment_status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ])
    is_paid = models.BooleanField(default=False)
    escrow_released = models.BooleanField(default=False)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    accepted_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Order #{self.id} - {self.title}"

class OrderDeliverable(models.Model):
    DELIVERABLE_STATUS = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('revision_requested', 'Revision Requested'),
    )
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='deliverables')
    file = models.FileField(upload_to='deliverables/')
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=DELIVERABLE_STATUS, default='pending')
    revision_notes = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Deliverable for Order #{self.order.id}"

class Review(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='review')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews')
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews')
    gig = models.ForeignKey(Gig, on_delete=models.CASCADE, related_name='reviews')
    
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for Order #{self.order.id} - {self.rating} stars"

class Team(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_teams')
    members = models.ManyToManyField(User, related_name='teams')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Conversation(models.Model):
    CONVERSATION_TYPES = (
        ('direct', 'Direct Message'),
        ('group', 'Group Chat'),
        ('team', 'Team Chat'),
    )
    
    GROUP_TYPES = (
        ('public', 'Public'),
        ('private', 'Private'),
        ('project', 'Project Restricted'),
    )
    
    participants = models.ManyToManyField(User, related_name='conversations')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='conversations', blank=True, null=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='conversations', blank=True, null=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='group_conversations', blank=True, null=True)
    conversation_type = models.CharField(max_length=10, choices=CONVERSATION_TYPES, default='direct')
    name = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    group_type = models.CharField(max_length=10, choices=GROUP_TYPES, default='public')
    password = models.CharField(max_length=255, blank=True, help_text="Password for private groups")
    invite_code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_conversations', blank=True, null=True)
    max_members = models.IntegerField(default=50, help_text="Maximum number of members allowed")
    is_discoverable = models.BooleanField(default=True, help_text="Whether group appears in public search")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name or f"Conversation {self.id}"
    
    def get_other_participant(self, user):
        return self.participants.exclude(id=user.id).first()
    
    def is_admin(self, user):
        return self.admin and self.admin.id == user.id
    
    def can_join(self, user, password=None):
        if self.group_type == 'public':
            return True
        elif self.group_type == 'private' and password:
            return self.password == password
        elif self.group_type == 'project' and self.project:
            # Check if user is part of the project (client or assigned freelancer)
            return (self.project.client == user or 
                   self.project.orders.filter(freelancer=user, status__in=['accepted', 'in_progress', 'delivered', 'completed']).exists())
        return False
    
    def save(self, *args, **kwargs):
        if self.conversation_type == 'group' and not self.invite_code:
            import random, string
            self.invite_code = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        super().save(*args, **kwargs)

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    attachment = models.FileField(upload_to='message_attachments/', blank=True, null=True)
    attachment_url = models.URLField(blank=True, null=True, help_text="URL for attachment access")
    attachment_name = models.CharField(max_length=255, blank=True, null=True, help_text="Original filename")
    attachment_type = models.CharField(max_length=50, blank=True, null=True, help_text="File type (image, video, etc.)")
    attachment_size = models.BigIntegerField(blank=True, null=True, help_text="File size in bytes")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]

    def __str__(self):
        return f"Message from {self.sender.username} at {self.created_at}"

class Portfolio(models.Model):
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio_items')
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to='portfolio/', blank=True, null=True)
    url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.freelancer.username} - {self.title}"

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('payment', 'Payment Received'),
        ('withdrawal', 'Withdrawal'),
        ('refund', 'Refund'),
        ('fee', 'Platform Fee'),
        ('bonus', 'Bonus'),
    )
    
    TRANSACTION_STATUS = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=15, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=200)
    reference = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=15, choices=TRANSACTION_STATUS, default='pending')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type} - ${self.amount} for {self.user.username}"

class Withdrawal(models.Model):
    WITHDRAWAL_STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='withdrawals')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=20)
    paystack_recipient_code = models.CharField(max_length=100, blank=True)
    paystack_transfer_code = models.CharField(max_length=100, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=15, choices=WITHDRAWAL_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Withdrawal #{self.id} - ${self.amount} for {self.user.username}"

class HelpRequest(models.Model):
    HELP_STATUS = (
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='help_requests')
    helper = models.ForeignKey(User, on_delete=models.CASCADE, related_name='help_provided', blank=True, null=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='help_requests')
    title = models.CharField(max_length=200)
    description = models.TextField()
    skills_needed = models.TextField(help_text="Comma-separated list of skills needed")
    payment_share = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage of order payment to share", validators=[MinValueValidator(0), MaxValueValidator(100)])
    status = models.CharField(max_length=15, choices=HELP_STATUS, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Help Request #{self.id} - {self.title}"

class GroupJoinRequest(models.Model):
    REQUEST_STATUS = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    group = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='join_requests')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_requests')
    message = models.TextField(blank=True, help_text="Optional message to group admin")
    status = models.CharField(max_length=10, choices=REQUEST_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    processed_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='processed_requests', blank=True, null=True)
    
    class Meta:
        unique_together = ['group', 'user']
    
    def __str__(self):
        return f"{self.user.username} -> {self.group.name or 'Group ' + str(self.group.id)}"

# Jobs/Projects Marketplace Models
class Job(models.Model):
    JOB_STATUS = (
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('closed', 'Closed'),
    )
    
    EXPERIENCE_LEVELS = (
        ('entry', 'Entry Level'),
        ('intermediate', 'Intermediate'),
        ('expert', 'Expert'),
    )
    
    JOB_TYPES = (
        ('fixed', 'Fixed Price'),
        ('hourly', 'Hourly'),
    )
    
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='jobs')
    budget_min = models.DecimalField(max_digits=10, decimal_places=2)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2)
    deadline = models.DateTimeField()
    skills_required = models.TextField(help_text="Comma-separated list of required skills")
    experience_level = models.CharField(max_length=15, choices=EXPERIENCE_LEVELS, default='intermediate')
    job_type = models.CharField(max_length=10, choices=JOB_TYPES, default='fixed')
    status = models.CharField(max_length=15, choices=JOB_STATUS, default='open')
    attachments = models.FileField(upload_to='job_attachments/', blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, help_text="Location preference")
    is_featured = models.BooleanField(default=False)
    proposal_count = models.IntegerField(default=0)
    likes_count = models.IntegerField(default=0)
    dislikes_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']

class Proposal(models.Model):
    PROPOSAL_STATUS = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    )
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='proposals')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='proposals')
    cover_letter = models.TextField()
    proposed_price = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_time = models.IntegerField(help_text="Proposed delivery time in days")
    attachments = models.FileField(upload_to='proposal_attachments/', blank=True, null=True)
    questions = models.TextField(blank=True, help_text="Questions for the client")
    status = models.CharField(max_length=15, choices=PROPOSAL_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['job', 'freelancer']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Proposal by {self.freelancer.username} for {self.job.title}"



# Notification System Models
class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('order', 'Order Update'),
        ('message', 'New Message'),
        ('job', 'Job Alert'),
        ('proposal', 'Proposal Update'),
        ('payment', 'Payment Update'),
        ('system', 'System Notification'),
        ('review', 'Review Notification'),
        ('help', 'Help Request'),
        ('group_invite', 'Group Invitation'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=15, choices=NOTIFICATION_TYPES)
    is_read = models.BooleanField(default=False)
    action_url = models.URLField(blank=True)
    related_object_id = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"

# Enhanced User Models
class UserVerification(models.Model):
    VERIFICATION_TYPES = (
        ('id', 'ID Verification'),
        ('skill', 'Skill Verification'),
        ('portfolio', 'Portfolio Verification'),
    )
    
    VERIFICATION_STATUS = (
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verifications')
    verification_type = models.CharField(max_length=15, choices=VERIFICATION_TYPES)
    status = models.CharField(max_length=15, choices=VERIFICATION_STATUS, default='pending')
    document = models.FileField(upload_to='verification_documents/', blank=True, null=True)
    notes = models.TextField(blank=True)
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.verification_type}"

class SavedSearch(models.Model):
    SEARCH_TYPES = (
        ('jobs', 'Jobs'),
        ('gigs', 'Gigs'),
        ('freelancers', 'Freelancers'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_searches')
    name = models.CharField(max_length=100)
    search_type = models.CharField(max_length=15, choices=SEARCH_TYPES)
    query_params = models.JSONField()  # Store search parameters as JSON
    is_active = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class OnboardingResponse(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='onboarding')
    is_completed = models.BooleanField(default=False)
    
    # Client-specific fields
    company_name = models.CharField(max_length=200, blank=True, null=True)
    company_size = models.CharField(max_length=50, blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)
    project_types = models.TextField(blank=True, null=True)  # JSON string
    budget_range = models.CharField(max_length=50, blank=True, null=True)
    timeline_preference = models.CharField(max_length=50, blank=True, null=True)
    goals = models.TextField(blank=True, null=True)
    hear_about_us = models.CharField(max_length=100, blank=True, null=True)
    
    # Freelancer-specific fields
    specialization = models.TextField(blank=True, null=True)  # JSON array
    experience_years = models.CharField(max_length=20, blank=True, null=True)
    education_level = models.CharField(max_length=50, blank=True, null=True)
    work_preference = models.CharField(max_length=50, blank=True, null=True)
    availability = models.CharField(max_length=50, blank=True, null=True)
    rate_expectation = models.CharField(max_length=50, blank=True, null=True)
    

    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Onboarding for {self.user.username}"

# Learning & Development Models
class Course(models.Model):
    DIFFICULTY_LEVELS = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    )
    
    COURSE_STATUS = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='courses')
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses_taught')
    difficulty_level = models.CharField(max_length=15, choices=DIFFICULTY_LEVELS, default='beginner')
    duration_hours = models.IntegerField(help_text="Estimated course duration in hours")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    thumbnail = models.ImageField(upload_to='course_thumbnails/', blank=True, null=True)
    thumbnail_url = models.URLField(blank=True, null=True, help_text="External image URL")
    preview_video = models.FileField(upload_to='course_previews/', blank=True, null=True)
    prerequisites = models.TextField(blank=True, help_text="Required skills or knowledge")
    learning_outcomes = models.TextField(help_text="What students will learn")
    course_file = models.FileField(upload_to='course_files/', blank=True, null=True, help_text="Main course content file (ZIP, PDF, etc.)")
    status = models.CharField(max_length=15, choices=COURSE_STATUS, default='draft')
    is_featured = models.BooleanField(default=False)
    enrollment_count = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_reviews = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']

class Lesson(models.Model):
    LESSON_TYPES = (
        ('video', 'Video'),
        ('text', 'Text'),
        ('quiz', 'Quiz'),
        ('assignment', 'Assignment'),
        ('resource', 'Resource'),
    )
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    lesson_type = models.CharField(max_length=15, choices=LESSON_TYPES, default='video')
    content = models.TextField(blank=True, help_text="Text content or video description")
    video_file = models.FileField(upload_to='lesson_videos/', blank=True, null=True)
    video_url = models.URLField(blank=True, null=True, help_text="External video URL (YouTube, Vimeo, etc.)")
    resource_file = models.FileField(upload_to='lesson_resources/', blank=True, null=True)
    duration_minutes = models.IntegerField(default=0, help_text="Lesson duration in minutes")
    order = models.IntegerField(default=0, help_text="Lesson order within course")
    is_preview = models.BooleanField(default=False, help_text="Can be viewed without enrollment")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Enrollment(models.Model):
    ENROLLMENT_STATUS = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
        ('suspended', 'Suspended'),
    )
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=15, choices=ENROLLMENT_STATUS, default='active')
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, validators=[MinValueValidator(0), MaxValueValidator(100)])
    completed_lessons = models.ManyToManyField(Lesson, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        unique_together = ['student', 'course']
    
    def __str__(self):
        return f"{self.student.username} - {self.course.title}"

class SkillAssessment(models.Model):
    ASSESSMENT_STATUS = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    skill_name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='assessments')
    difficulty_level = models.CharField(max_length=15, choices=Course.DIFFICULTY_LEVELS, default='beginner')
    time_limit_minutes = models.IntegerField(default=60)
    passing_score = models.IntegerField(default=70, help_text="Minimum score to pass (percentage)")
    status = models.CharField(max_length=15, choices=ASSESSMENT_STATUS, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.skill_name} Assessment"

class AssessmentQuestion(models.Model):
    QUESTION_TYPES = (
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
        ('code', 'Code Challenge'),
    )
    
    assessment = models.ForeignKey(SkillAssessment, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='multiple_choice')
    options = models.JSONField(blank=True, null=True, help_text="JSON array of answer options")
    correct_answer = models.TextField(help_text="Correct answer or answer key")
    explanation = models.TextField(blank=True, help_text="Explanation of correct answer")
    points = models.IntegerField(default=1)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.assessment.title} - Q{self.order}"

class AssessmentAttempt(models.Model):
    ATTEMPT_STATUS = (
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('timed_out', 'Timed Out'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessment_attempts')
    assessment = models.ForeignKey(SkillAssessment, on_delete=models.CASCADE, related_name='attempts')
    answers = models.JSONField(default=dict, help_text="User's answers to questions")
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    passed = models.BooleanField(default=False)
    status = models.CharField(max_length=15, choices=ATTEMPT_STATUS, default='in_progress')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.assessment.title} ({self.score}%)"

class CourseBadge(models.Model):
    BADGE_TYPES = (
        ('skill', 'Skill Mastery'),
        ('course', 'Course Completion'),
        ('achievement', 'Special Achievement'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_badges')
    badge_type = models.CharField(max_length=15, choices=BADGE_TYPES, default='skill')
    name = models.CharField(max_length=100)
    description = models.TextField()
    skill_name = models.CharField(max_length=100, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, blank=True, null=True)
    assessment = models.ForeignKey(SkillAssessment, on_delete=models.CASCADE, blank=True, null=True)
    badge_icon = models.CharField(max_length=50, default='🏆')
    earned_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class CourseReview(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['course', 'student']
    
    def __str__(self):
        return f"{self.course.title} - {self.rating} stars"

# Admin & Moderation Models
class Dispute(models.Model):
    DISPUTE_CATEGORIES = (
        ('quality', 'Quality Issues'),
        ('delivery', 'Delivery Problems'),
        ('payment', 'Payment Issues'),
        ('communication', 'Communication Problems'),
        ('scope', 'Scope Disagreement'),
        ('other', 'Other'),
    )
    
    DISPUTE_STATUS = (
        ('open', 'Open'),
        ('investigating', 'Under Investigation'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    )
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='disputes')
    complainant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='filed_disputes')
    respondent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_disputes')
    category = models.CharField(max_length=20, choices=DISPUTE_CATEGORIES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    evidence = models.FileField(upload_to='dispute_evidence/', blank=True, null=True)
    admin_notes = models.TextField(blank=True)
    resolution = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=DISPUTE_STATUS, default='open')
    assigned_admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_disputes')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"Dispute #{self.id} - {self.title}"

class ContentReport(models.Model):
    REPORT_TYPES = (
        ('gig', 'Inappropriate Gig'),
        ('job', 'Inappropriate Job'),
        ('message', 'Inappropriate Message'),
        ('profile', 'Inappropriate Profile'),
        ('review', 'Inappropriate Review'),
        ('spam', 'Spam Content'),
        ('fraud', 'Fraudulent Activity'),
    )
    
    REPORT_STATUS = (
        ('pending', 'Pending Review'),
        ('reviewing', 'Under Review'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    )
    
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='filed_reports')
    report_type = models.CharField(max_length=15, choices=REPORT_TYPES)
    content_type = models.CharField(max_length=50)
    content_id = models.IntegerField()
    reason = models.TextField()
    evidence = models.FileField(upload_to='report_evidence/', blank=True, null=True)
    status = models.CharField(max_length=15, choices=REPORT_STATUS, default='pending')
    admin_notes = models.TextField(blank=True)
    action_taken = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"Report #{self.id} - {self.report_type}"

class AdminAction(models.Model):
    ACTION_TYPES = (
        ('user_suspend', 'User Suspended'),
        ('user_activate', 'User Activated'),
        ('content_remove', 'Content Removed'),
        ('content_approve', 'Content Approved'),
        ('dispute_resolve', 'Dispute Resolved'),
        ('refund_process', 'Refund Processed'),
        ('payment_release', 'Payment Released'),
    )
    
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_actions')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    target_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_actions_received', null=True, blank=True)
    description = models.TextField()
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.action_type} by {self.admin.username}"

class SystemSettings(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.key

# Notification System Models
class NotificationPreference(models.Model):
    NOTIFICATION_CATEGORIES = (
        ('order_updates', 'Order Updates'),
        ('messages', 'Messages'),
        ('job_alerts', 'Job Alerts'),
        ('system_notifications', 'System Notifications'),
        ('marketing', 'Marketing Communications'),
        ('proposals', 'Proposal Updates'),
        ('payments', 'Payment Notifications'),
        ('reviews', 'Review Notifications'),
    )
    
    DELIVERY_METHODS = (
        ('in_app', 'In-app Notifications'),
        ('email', 'Email Notifications'),
        ('sms', 'SMS Notifications'),
        ('push', 'Push Notifications'),
    )
    
    FREQUENCY_SETTINGS = (
        ('instant', 'Instant'),
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Summary'),
        ('disabled', 'Disabled'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_preferences')
    category = models.CharField(max_length=20, choices=NOTIFICATION_CATEGORIES)
    delivery_method = models.CharField(max_length=10, choices=DELIVERY_METHODS)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_SETTINGS, default='instant')
    is_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'category', 'delivery_method']
    
    def __str__(self):
        return f"{self.user.username} - {self.category} - {self.delivery_method}"

class NotificationTemplate(models.Model):
    TEMPLATE_TYPES = (
        ('order_created', 'Order Created'),
        ('order_delivered', 'Order Delivered'),
        ('order_completed', 'Order Completed'),
        ('message_received', 'Message Received'),
        ('proposal_accepted', 'Proposal Accepted'),
        ('proposal_rejected', 'Proposal Rejected'),
        ('payment_received', 'Payment Received'),
        ('withdrawal_processed', 'Withdrawal Processed'),
        ('review_received', 'Review Received'),
        ('job_posted', 'Job Posted'),
        ('system_announcement', 'System Announcement'),
    )
    
    template_type = models.CharField(max_length=30, choices=TEMPLATE_TYPES, unique=True)
    title_template = models.CharField(max_length=200)
    message_template = models.TextField()
    email_subject = models.CharField(max_length=200, blank=True)
    email_template = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.template_type} Template"

# Error Handling Models
class ErrorLog(models.Model):
    ERROR_TYPES = (
        ('javascript', 'JavaScript Error'),
        ('network', 'Network Error'),
        ('api', 'API Error'),
        ('validation', 'Validation Error'),
        ('authentication', 'Authentication Error'),
        ('permission', 'Permission Error'),
        ('server', 'Server Error'),
    )
    
    error_type = models.CharField(max_length=20, choices=ERROR_TYPES)
    message = models.TextField()
    stack_trace = models.TextField(blank=True)
    url = models.URLField()
    user_agent = models.TextField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.error_type}: {self.message[:50]}..."

# Analytics Models
class UserAnalytics(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    total_orders = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    profile_views = models.IntegerField(default=0)
    gig_views = models.IntegerField(default=0)
    conversion_rate = models.FloatField(default=0)
    avg_rating = models.FloatField(default=0)
    response_time = models.IntegerField(default=0)  # in minutes
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Analytics for {self.user.username}"

class PlatformAnalytics(models.Model):
    date = models.DateField(unique=True)
    total_users = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    total_orders = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    avg_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    conversion_rate = models.FloatField(default=0)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"Platform Analytics - {self.date}"

class AnalyticsEvent(models.Model):
    EVENT_TYPES = (
        ('page_view', 'Page View'),
        ('gig_view', 'Gig View'),
        ('profile_view', 'Profile View'),
        ('order_created', 'Order Created'),
        ('message_sent', 'Message Sent'),
        ('search_performed', 'Search Performed'),
        ('filter_applied', 'Filter Applied'),
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('registration', 'User Registration'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    event_data = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    session_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.event_type} - {self.timestamp}"

# Integration Models
class ThirdPartyIntegration(models.Model):
    PROVIDERS = (
        ('linkedin', 'LinkedIn'),
        ('github', 'GitHub'),
        ('google', 'Google Calendar'),
        ('slack', 'Slack'),
        ('zoom', 'Zoom'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    provider = models.CharField(max_length=20, choices=PROVIDERS)
    provider_user_id = models.CharField(max_length=200)
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    sync_enabled = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'provider']
    
    def __str__(self):
        return f"{self.user.username} - {self.provider}"

class IntegrationSync(models.Model):
    SYNC_TYPES = (
        ('profile_import', 'Profile Import'),
        ('portfolio_sync', 'Portfolio Sync'),
        ('calendar_sync', 'Calendar Sync'),
        ('notification_sync', 'Notification Sync'),
    )
    
    SYNC_STATUS = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    integration = models.ForeignKey(ThirdPartyIntegration, on_delete=models.CASCADE)
    sync_type = models.CharField(max_length=20, choices=SYNC_TYPES)
    status = models.CharField(max_length=15, choices=SYNC_STATUS, default='pending')
    sync_data = models.JSONField(default=dict)
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.integration.provider} - {self.sync_type}"

# Like/Dislike System
class Like(models.Model):
    CONTENT_TYPES = (
        ('freelancer', 'Freelancer'),
        ('job', 'Job'),
        ('gig', 'Gig'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    content_type = models.CharField(max_length=15, choices=CONTENT_TYPES)
    object_id = models.IntegerField()
    is_like = models.BooleanField(default=True)  # True for like, False for dislike
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'content_type', 'object_id']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        action = 'liked' if self.is_like else 'disliked'
        return f"{self.user.username} {action} {self.content_type} #{self.object_id}"



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

# AI Assistant Models
class AIConversation(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ai_conversation')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"AI Conversation - {self.user.username}"

class AIMessage(models.Model):
    MESSAGE_ROLES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
    )
    
    conversation = models.ForeignKey(AIConversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=MESSAGE_ROLES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."

# Skill Assessment System Models
class AssessmentCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50)  # Icon class name
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Assessment Categories"
    
    def __str__(self):
        return self.name

class Assessment(models.Model):
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert')
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(AssessmentCategory, on_delete=models.CASCADE)
    difficulty_level = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    duration_minutes = models.IntegerField()  # Test duration
    passing_score = models.IntegerField()  # Minimum score to pass (%)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('5.00'))
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title

class Question(models.Model):
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('coding', 'Coding Challenge'),
        ('text', 'Text Answer')
    ]
    
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    points = models.IntegerField(default=1)
    order = models.IntegerField()
    is_required = models.BooleanField(default=True)
    explanation = models.TextField(blank=True)  # Explanation for correct answer
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.assessment.title} - Q{self.order}"

class QuestionOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField()
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.question} - Option {self.order}"

class AssessmentPayment(models.Model):
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_reference = models.CharField(max_length=100, unique=True)
    paystack_reference = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.assessment.title} - ${self.amount}"

class AssessmentAttempt(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
        ('abandoned', 'Abandoned')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    payment = models.ForeignKey(AssessmentPayment, on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    score = models.IntegerField(null=True, blank=True)  # Final score percentage
    total_points = models.IntegerField(null=True, blank=True)
    earned_points = models.IntegerField(null=True, blank=True)
    passed = models.BooleanField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(default=timezone.now)  # Auto-calculated based on duration
    time_spent_minutes = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.assessment.title} ({self.status})"

class AssessmentAnswer(models.Model):
    attempt = models.ForeignKey(AssessmentAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(QuestionOption, on_delete=models.CASCADE, null=True, blank=True)
    text_answer = models.TextField(blank=True)  # For text/coding questions
    is_correct = models.BooleanField(null=True, blank=True)
    points_earned = models.IntegerField(default=0)
    answered_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.attempt} - {self.question}"

class SkillBadge(models.Model):
    BADGE_LEVELS = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessment_badges')
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, null=True, blank=True)
    attempt = models.ForeignKey(AssessmentAttempt, on_delete=models.CASCADE, null=True, blank=True)
    badge_level = models.CharField(max_length=20, choices=BADGE_LEVELS, default='bronze')
    score_percentage = models.IntegerField(default=0)
    earned_at = models.DateTimeField(auto_now_add=True)
    is_displayed = models.BooleanField(default=True)  # User can hide badges
    
    def __str__(self):
        return f"{self.user.username} - {self.assessment.title} - {self.badge_level}"