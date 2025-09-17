from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class SupportTicket(models.Model):
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('waiting_response', 'Waiting for Response'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    )
    
    CATEGORY_CHOICES = (
        ('account', 'Account Issues'),
        ('payment', 'Payment & Billing'),
        ('technical', 'Technical Support'),
        ('gig', 'Gig Related'),
        ('order', 'Order Issues'),
        ('verification', 'Verification'),
        ('other', 'Other'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_tickets')
    ticket_id = models.CharField(max_length=20, unique=True, blank=True)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    attachment = models.FileField(upload_to='ticket_attachments/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.ticket_id:
            import random, string
            self.ticket_id = 'TK' + ''.join(random.choices(string.digits, k=8))
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.ticket_id} - {self.subject}"
    
    class Meta:
        ordering = ['-created_at']

class TicketReply(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='replies')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    attachment = models.FileField(upload_to='ticket_replies/', blank=True, null=True)
    is_staff_reply = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Reply to {self.ticket.ticket_id} by {self.user.username}"
    
    class Meta:
        ordering = ['created_at']