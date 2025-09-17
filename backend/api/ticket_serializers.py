from rest_framework import serializers
from .ticket_models import SupportTicket, TicketReply
from django.contrib.auth.models import User

class TicketReplySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = TicketReply
        fields = ['id', 'message', 'attachment', 'is_staff_reply', 'created_at', 'user_name', 'user_username']
        read_only_fields = ['id', 'created_at', 'is_staff_reply', 'user_name', 'user_username']

class SupportTicketSerializer(serializers.ModelSerializer):
    replies = TicketReplySerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = ['id', 'ticket_id', 'subject', 'description', 'category', 'priority', 'status', 
                 'attachment', 'created_at', 'updated_at', 'resolved_at', 'user_name', 
                 'assigned_to_name', 'replies']
        read_only_fields = ['id', 'ticket_id', 'created_at', 'updated_at', 'resolved_at', 
                           'user_name', 'assigned_to_name', 'replies']

class CreateTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ['subject', 'description', 'category', 'priority', 'attachment']