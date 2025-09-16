from django.urls import path
from . import verification_views

urlpatterns = [
    # User verification endpoints
    path('submit/', verification_views.submit_verification_request, name='submit_verification'),
    path('status/', verification_views.get_verification_status, name='verification_status'),
    path('badge/', verification_views.get_user_verification_badge, name='user_verification_badge'),
    path('badge/<int:user_id>/', verification_views.get_user_verification_badge, name='user_verification_badge_by_id'),
    
    # Admin verification endpoints
    path('admin/requests/', verification_views.list_verification_requests, name='admin_verification_requests'),
    path('admin/requests/<int:request_id>/', verification_views.manage_verification_request, name='admin_manage_verification'),
    path('admin/overview/', verification_views.admin_verification_overview, name='admin_verification_overview'),
]