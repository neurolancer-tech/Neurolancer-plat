from rest_framework import serializers
from .verification_models import VerificationRequest, VerificationBadge
from django.contrib.auth.models import User

class VerificationRequestSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True)
    
    class Meta:
        model = VerificationRequest
        fields = [
            'id', 'user', 'user_email', 'user_first_name', 'user_last_name',
            'status', 'id_document', 'id_document_type', 'secondary_document',
            'secondary_document_type', 'certificates', 'portfolio_link',
            'linkedin_profile', 'full_name', 'date_of_birth', 'address',
            'phone_number', 'admin_notes', 'reviewed_by', 'reviewed_by_name',
            'reviewed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'reviewed_by', 'reviewed_at']

class VerificationRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationRequest
        fields = [
            'id_document', 'id_document_type', 'secondary_document',
            'secondary_document_type', 'certificates', 'portfolio_link',
            'linkedin_profile', 'full_name', 'date_of_birth', 'address',
            'phone_number'
        ]

class VerificationBadgeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = VerificationBadge
        fields = ['user', 'username', 'is_verified', 'verified_at', 'verification_level']
        read_only_fields = ['user', 'verified_at']

class AdminVerificationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationRequest
        fields = ['status', 'admin_notes']
        
    def validate_status(self, value):
        if value not in ['pending', 'verifying', 'verified', 'rejected', 'cancelled', 'invalid']:
            raise serializers.ValidationError("Invalid status")
        return value