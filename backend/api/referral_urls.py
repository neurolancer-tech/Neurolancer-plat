from django.urls import path
from . import referral_views, admin_referral_views

urlpatterns = [
    # User referral endpoints
    path('info/', referral_views.get_referral_info, name='referral-info'),
    path('earnings/', referral_views.get_referral_earnings, name='referral-earnings'),
    path('withdrawals/', referral_views.get_referral_withdrawals, name='referral-withdrawals'),
    path('withdraw/', referral_views.request_referral_withdrawal, name='referral-withdraw'),
    
    # Admin referral endpoints
    path('admin/settings/', admin_referral_views.admin_referral_settings, name='admin-referral-settings'),
    path('admin/stats/', admin_referral_views.admin_referral_stats, name='admin-referral-stats'),
    path('admin/users/', admin_referral_views.admin_referral_users, name='admin-referral-users'),
    path('admin/users/<int:user_id>/', admin_referral_views.admin_update_referral_user, name='admin-update-referral-user'),
    path('admin/withdrawals/', admin_referral_views.admin_referral_withdrawals, name='admin-referral-withdrawals'),
    path('admin/withdrawals/<int:withdrawal_id>/process/', admin_referral_views.admin_process_withdrawal, name='admin-process-withdrawal'),
    path('admin/award-bonus/', admin_referral_views.admin_award_bonus, name='admin-award-bonus'),
]