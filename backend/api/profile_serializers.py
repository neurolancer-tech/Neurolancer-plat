from rest_framework import serializers
from django.contrib.auth.models import User
from .models import FreelancerProfile, ClientProfile, UserProfile

class FreelancerProfileSerializer(serializers.ModelSerializer):
    user_info = serializers.SerializerMethodField()
    
    class Meta:
        model = FreelancerProfile
        fields = [
            'id', 'title', 'bio', 'hourly_rate', 'availability',
            'skills', 'experience_years', 'portfolio_url', 'github_url', 'linkedin_url',
            'rating', 'total_reviews', 'completed_projects', 'response_time',
            'is_active', 'is_verified', 'created_at', 'updated_at', 'user_info'
        ]
        read_only_fields = ['rating', 'total_reviews', 'completed_projects', 'created_at', 'updated_at']
    
    def get_user_info(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'email': obj.user.email,
            'avatar_url': obj.user_profile.get_avatar_url() if obj.user_profile else None,
            'country': obj.user_profile.country if obj.user_profile else None,
            'city': obj.user_profile.city if obj.user_profile else None,
        }

class ClientProfileSerializer(serializers.ModelSerializer):
    user_info = serializers.SerializerMethodField()
    
    class Meta:
        model = ClientProfile
        fields = [
            'id', 'company_name', 'company_size', 'industry', 'website_url',
            'typical_budget', 'project_types', 'total_projects_posted', 'total_spent',
            'avg_rating_given', 'is_active', 'is_verified', 'created_at', 'updated_at', 'user_info'
        ]
        read_only_fields = ['total_projects_posted', 'total_spent', 'avg_rating_given', 'created_at', 'updated_at']
    
    def get_user_info(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'email': obj.user.email,
            'avatar_url': obj.user_profile.get_avatar_url() if obj.user_profile else None,
            'country': obj.user_profile.country if obj.user_profile else None,
            'city': obj.user_profile.city if obj.user_profile else None,
        }