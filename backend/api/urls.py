from django.urls import path, include
from . import views
from . import views_payments
from . import assessment_views
from .debug_views import debug_gigs
from .payments import (
    initialize_payment, verify_payment, paystack_webhook,
    get_banks, release_escrow,
    get_mobile_money_providers, calculate_payment_fees
)
from .simple_withdrawal import simple_withdrawal
from .paystack_withdrawal import paystack_withdraw, get_paystack_banks, create_recipient, process_withdrawal
from .test_paystack_withdrawal import test_paystack_withdraw
from .location_views import get_location_by_coordinates, get_location_by_ip
from . import profile_views
from .profile_views import freelancer_profile_view, client_profile_view, public_freelancer_profiles
from .admin_ticket_views import AdminTicketListView, AdminTicketDetailView, admin_ticket_stats, admin_reply_ticket, assign_ticket, update_ticket_status, send_custom_notification

urlpatterns = [
    # Enhanced Authentication URLs
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/google/', views.google_auth, name='google-auth'),
    path('auth/profile/', views.profile, name='profile'),
    path('auth/complete-profile/', views.complete_profile, name='complete-profile'),
    path('auth/send-phone-verification/', views.send_phone_verification, name='send-phone-verification'),
    path('auth/verify-phone/', views.verify_phone_number, name='verify-phone'),
    path('auth/get-profile/', views.get_user_profile, name='get-user-profile'),
    path('auth/verify-email/', views.verify_email, name='verify-email'),
    path('auth/resend-verification/', views.resend_verification_email, name='resend-verification'),
    path('auth/check-verification/', views.check_email_verification, name='check-verification'),
    path('auth/check-email/', views.check_email_exists, name='check-email'),
    path('auth/forgot-password/', views.forgot_password, name='forgot-password'),
    path('auth/reset-password/', views.reset_password, name='reset-password'),
    path('auth/validate-reset-token/', views.validate_reset_token, name='validate-reset-token'),
    path('auth/debug-auth/', views.debug_auth, name='debug-auth'),
    path('auth/list-users/', views.list_users, name='list-users'),
    path('auth/test-password-set/', views.test_password_set, name='test-password-set'),
    path('auth/quick-login-test/', views.quick_login_test, name='quick-login-test'),
    path('auth/test-endpoint/', views.test_login_endpoint, name='test-login-endpoint'),
    
    # Category URLs
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/<int:pk>/', views.CategoryUpdateView.as_view(), name='category-update'),
    
# Subcategory URLs
    path('categories/with-subcategories/', views.get_categories_with_subcategories, name='categories-with-subcategories'),
    path('categories-with-subcategories/', views.get_categories_with_subcategories, name='categories-with-subcategories-alt'),
    path('categories/<int:category_id>/subcategories/', views.get_subcategories_by_category, name='subcategories-by-category'),
    path('subcategories/', views.get_all_subcategories, name='all-subcategories'),
    
    # Gig URLs
    path('gigs/', views.GigListView.as_view(), name='gig-list'),
    path('gigs/search/', views.search_gigs, name='gig-search'),
    path('gigs/create/', views.GigCreateView.as_view(), name='gig-create'),
    path('gigs/my/', views.MyGigsView.as_view(), name='my-gigs'),
    path('gigs/<int:pk>/', views.GigDetailView.as_view(), name='gig-detail'),
    path('gigs/<int:pk>/update/', views.GigUpdateView.as_view(), name='gig-update'),
    path('gigs/<int:pk>/delete/', views.GigDeleteView.as_view(), name='gig-delete'),
    
    # Order URLs
    path('orders/', views.OrderListView.as_view(), name='order-list'),
    path('orders/create/', views.OrderCreateView.as_view(), name='order-create'),
    path('orders/client/', views.ClientOrdersView.as_view(), name='client-orders'),
    path('orders/freelancer/', views.FreelancerOrdersView.as_view(), name='freelancer-orders'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:order_id>/accept/', views.accept_order, name='accept-order'),
    path('orders/<int:order_id>/update-status/', views.update_order_status, name='update-order-status'),
    path('orders/<int:order_id>/request-update/', views.request_order_update, name='request-order-update'),
    path('orders/<int:order_id>/process-payment/', views.process_order_payment, name='process-order-payment'),
    path('orders/<int:order_id>/request-payment/', views.request_order_payment, name='request-order-payment'),
    
    # Project URLs
    path('projects/', views.ProjectListView.as_view(), name='project-list'),
    path('projects/create/', views.ProjectCreateView.as_view(), name='project-create'),
    path('projects/<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:pk>/update/', views.ProjectUpdateView.as_view(), name='project-update'),
    path('projects/<int:project_id>/team/', views.project_team, name='project-team'),
    
    # Task URLs
    path('tasks/create/', views.TaskCreateView.as_view(), name='task-create'),
    path('tasks/<int:pk>/', views.TaskUpdateView.as_view(), name='task-update'),
    path('tasks/<int:task_id>/progress/', views.update_task_progress, name='update-task-progress'),
    path('task-proposals/send/', views.send_task_proposal, name='send-task-proposal'),
    path('task-proposals/<int:proposal_id>/respond/', views.respond_task_proposal, name='respond-task-proposal'),
    
    # Task Assignment URLs
    path('task-assignments/create/', views.create_task_assignment, name='create-task-assignment'),
    path('tasks/<int:task_id>/accept/', views.accept_task_assignment, name='accept-task-assignment'),
    path('tasks/<int:task_id>/decline/', views.decline_task_assignment, name='decline-task-assignment'),
    
    # Order Deliverable URLs
    path('orders/<int:order_id>/deliverables/', views.OrderDeliverableListView.as_view(), name='order-deliverables'),
    path('deliverables/create/', views.OrderDeliverableCreateView.as_view(), name='deliverable-create'),
    
    # Review URLs
    path('reviews/create/', views.ReviewCreateView.as_view(), name='review-create'),
    path('gigs/<int:gig_id>/reviews/', views.ReviewListView.as_view(), name='gig-reviews'),
    
    # Message URLs
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:conversation_id>/messages/', views.MessageListView.as_view(), name='conversation-messages'),
    path('conversations/<int:conversation_id>/mark-read/', views.mark_messages_read, name='mark-messages-read'),
    path('conversations/start/', views.start_conversation, name='start-conversation'),
    path('messages/create/', views.MessageCreateView.as_view(), name='message-create'),
    path('messages/<int:pk>/', views.MessageUpdateView.as_view(), name='message-update'),
    
    # Portfolio URLs
    path('portfolio/create/', views.PortfolioCreateView.as_view(), name='portfolio-create'),
    path('portfolio/my/', views.MyPortfolioView.as_view(), name='my-portfolio'),
    path('portfolio/<int:pk>/', views.PortfolioUpdateView.as_view(), name='portfolio-update'),
    path('freelancers/<int:freelancer_id>/portfolio/', views.PortfolioListView.as_view(), name='freelancer-portfolio'),
    
    # Withdrawal URLs
    path('withdrawals/', views.WithdrawalListView.as_view(), name='withdrawal-list'),
    path('withdrawals/create/', views.WithdrawalCreateView.as_view(), name='withdrawal-create'),
    
    # Freelancer URLs
    path('freelancers/', views.FreelancerListView.as_view(), name='freelancer-list'),
    path('profiles/freelancers/public/', public_freelancer_profiles, name='public-freelancer-profiles'),
    path('profile/freelancer/toggle-publish/', profile_views.toggle_freelancer_publish, name='toggle-freelancer-publish'),
    
    # User URLs
    path('users/', views.all_users, name='all-users'),
    
    # Team URLs
    path('teams/', views.TeamListView.as_view(), name='team-list'),
    path('teams/<int:pk>/', views.TeamDetailView.as_view(), name='team-detail'),
    path('teams/<int:team_id>/join/', views.join_team, name='join-team'),
    
    # Group Chat URLs
    path('conversations/group/create/', views.create_group_chat, name='create-group-chat'),
    path('conversations/direct/start/', views.start_direct_conversation, name='start-direct-conversation'),
    path('conversations/direct/create/', views.start_direct_conversation, name='create-direct-conversation'),
    path('groups/discover/', views.discover_groups, name='discover-groups'),
    path('groups/<int:group_id>/join/', views.join_group, name='join-group'),
    path('groups/<int:group_id>/leave/', views.leave_group, name='leave-group'),
    path('groups/<int:group_id>/update/', views.update_group, name='update-group'),
    path('groups/<int:group_id>/transfer-admin/', views.transfer_admin, name='transfer-admin'),
    path('groups/<int:group_id>/remove-member/', views.remove_member, name='remove-member'),
    
    # User Profile URLs
    path('profile/update/', views.UserProfileUpdateView.as_view(), name='profile-update'),
    path('profile/avatar/update/', views.update_avatar, name='update-avatar'),
    path('profile/documents/', views.ProfessionalDocumentListView.as_view(), name='professional-documents'),
    path('profile/documents/create/', views.ProfessionalDocumentCreateView.as_view(), name='document-create'),
    path('profile/documents/<int:pk>/delete/', views.ProfessionalDocumentDeleteView.as_view(), name='document-delete'),
    path('avatars/available/', views.get_available_avatars, name='available-avatars'),
    path('freelancers/<int:user_id>/', views.FreelancerProfileView.as_view(), name='freelancer-profile'),
    
    # Dashboard URLs
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    
    # Help Request URLs
    path('help-requests/', views.HelpRequestListView.as_view(), name='help-request-list'),
    path('help-requests/create/', views.HelpRequestCreateView.as_view(), name='help-request-create'),
    path('help-requests/my/', views.MyHelpRequestsView.as_view(), name='my-help-requests'),
    path('help-requests/<int:pk>/', views.HelpRequestDetailView.as_view(), name='help-request-detail'),
    
    # Payment URLs
    path('payments/initialize/', initialize_payment, name='initialize-payment'),
    path('payments/verify/', verify_payment, name='verify-payment'),
    path('payments/webhook/', paystack_webhook, name='paystack-webhook'),
    path('payments/withdraw/', test_paystack_withdraw, name='test-paystack-withdrawal'),
    path('payments/withdraw-paystack/', paystack_withdraw, name='paystack-withdrawal'),
    path('payments/withdraw-simple/', simple_withdrawal, name='simple-withdrawal'),
    path('payments/banks/', get_paystack_banks, name='paystack-banks'),
    path('payments/create-recipient/', create_recipient, name='create-recipient'),
    path('payments/process-withdrawal/', process_withdrawal, name='process-withdrawal'),
    path('payments/mobile-money/', get_mobile_money_providers, name='get-mobile-money-providers'),
    path('payments/calculate-fees/', calculate_payment_fees, name='calculate-payment-fees'),
    path('payments/release-escrow/', release_escrow, name='release-escrow'),
    
    # Paystack Subaccount URLs
    path('payments/subaccount/create/', views_payments.create_subaccount, name='create-subaccount'),
    path('payments/banks/', views_payments.get_banks, name='paystack-banks'),
    path('payments/initialize/', views_payments.initialize_payment, name='paystack-initialize'),
    path('payments/verify/', views_payments.verify_payment, name='paystack-verify'),
    
    # Jobs/Projects Marketplace URLs
    path('jobs/', views.JobListView.as_view(), name='job-list'),
    path('jobs/search/', views.search_jobs, name='job-search'),
    path('jobs/create/', views.JobCreateView.as_view(), name='job-create'),
    path('jobs/my/', views.MyJobsView.as_view(), name='my-jobs'),
    path('jobs/<int:pk>/', views.JobDetailView.as_view(), name='job-detail'),
    path('jobs/<int:pk>/update/', views.JobUpdateView.as_view(), name='job-update'),
    path('jobs/<int:pk>/delete/', views.JobDeleteView.as_view(), name='job-delete'),
    path('jobs/<int:job_id>/update-status/', views.update_job_status, name='update-job-status'),
    
    # Proposal URLs
    path('proposals/create/', views.ProposalCreateView.as_view(), name='proposal-create'),
    path('proposals/my/', views.MyProposalsView.as_view(), name='my-proposals'),
    path('proposals/<int:pk>/update/', views.ProposalUpdateView.as_view(), name='proposal-update'),
    path('proposals/<int:proposal_id>/accept/', views.accept_proposal, name='accept-proposal'),
    path('proposals/<int:proposal_id>/reject/', views.reject_proposal, name='reject-proposal'),
    path('jobs/<int:job_id>/proposals/', views.ProposalListView.as_view(), name='job-proposals'),
    
    # Notification URLs
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/create/', views.NotificationCreateView.as_view(), name='notification-create'),
    path('notifications/unread-count/', views.UnreadNotificationCountView.as_view(), name='unread-notification-count'),
    path('notifications/<int:notification_id>/mark-read/', views.mark_notification_read, name='mark-notification-read'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark-all-notifications-read'),
    
    # Payment Request URLs
    path('payments/request/', views.request_payment, name='request-payment'),
    path('request-payment/', views.request_payment, name='request-payment-alt'),
    path('jobs/<int:job_id>/process-payment/', views.process_job_payment, name='process-job-payment'),
    path('jobs/<int:job_id>/request-payment/', views.request_job_payment, name='request-job-payment'),
    path('jobs/<int:job_id>/request-payment/', views.request_job_payment, name='request-job-payment'),
    path('jobs/<int:job_id>/complete/', views.complete_job_work, name='complete-job-work'),
    path('orders/<int:order_id>/complete/', views.complete_job_work, name='complete-order-work'),
    
    # Additional Proposal URLs
    path('proposals/<int:proposal_id>/update-status/', views.update_proposal_status, name='update-proposal-status'),
    path('jobs/<int:job_id>/proposals/<int:proposal_id>/', views.job_proposal_details, name='job-proposal-details'),
    
    # Debug URLs
    path('debug/gigs/', debug_gigs, name='debug-gigs'),
    path('debug/proposals/<int:proposal_id>/', views.debug_proposal_status, name='debug-proposal-status'),
    path('debug/jobs/<int:job_id>/proposals/', views.debug_job_proposals, name='debug-job-proposals'),
    path('debug/notifications/', views.debug_notifications, name='debug-notifications'),

    
    # Saved Search URLs
    path('saved-searches/', views.SavedSearchListView.as_view(), name='saved-search-list'),
    path('saved-searches/create/', views.SavedSearchCreateView.as_view(), name='saved-search-create'),
    path('saved-searches/<int:pk>/delete/', views.SavedSearchDeleteView.as_view(), name='saved-search-delete'),
    
    # Onboarding URLs
    path('onboarding/', views.get_onboarding_data, name='onboarding-data'),
    path('onboarding/status/', views.check_onboarding_status, name='onboarding-status'),
    path('onboarding/create/', views.OnboardingResponseCreateView.as_view(), name='onboarding-create'),
    path('onboarding/update/', views.OnboardingResponseUpdateView.as_view(), name='onboarding-update'),
    
    # Learning & Development URLs  
    path('courses/', views.CourseListView.as_view(), name='course-list'),
    path('courses/create/', views.CourseCreateView.as_view(), name='course-create'),
    path('courses/<int:pk>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('courses/<int:pk>/update/', views.CourseUpdateView.as_view(), name='course-update'),
    path('courses/<int:course_id>/enroll/', views.CourseEnrollView.as_view(), name='course-enroll'),
    path('courses/<int:course_id>/lessons/', views.CourseLessonsView.as_view(), name='course-lessons'),
    path('courses/<int:course_id>/reviews/', views.CourseReviewListView.as_view(), name='course-reviews'),
    path('courses/my/', views.MyCoursesView.as_view(), name='my-courses'),
    path('courses/my-created/', views.MyCreatedCoursesView.as_view(), name='my-created-courses'),
    path('courses/reviews/create/', views.CourseReviewCreateView.as_view(), name='course-review-create'),
    
    # Enrollment URLs
    path('enrollments/', views.EnrollmentListView.as_view(), name='enrollment-list'),
    
    # Lesson URLs
    path('lessons/create/', views.LessonCreateView.as_view(), name='lesson-create'),
    path('lessons/<int:pk>/update/', views.LessonUpdateView.as_view(), name='lesson-update'),
    path('lessons/<int:pk>/delete/', views.LessonDeleteView.as_view(), name='lesson-delete'),
    path('lessons/<int:lesson_id>/complete/', views.mark_lesson_complete, name='mark-lesson-complete'),
    

    
    # Skill Badge URLs
    path('badges/my/', views.MySkillBadgesView.as_view(), name='my-skill-badges'),
    
    # Learning Dashboard URLs
    path('learning/dashboard/', views.learning_dashboard, name='learning-dashboard'),
    
    # Admin & Moderation URLs
    path('admin/dashboard/stats/', views.admin_dashboard_stats, name='admin-dashboard-stats'),
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', views.AdminUserUpdateView.as_view(), name='admin-user-update'),
    path('admin/gigs/', views.AdminGigListView.as_view(), name='admin-gig-list'),
    path('admin/gigs/<int:pk>/', views.AdminGigUpdateView.as_view(), name='admin-gig-update'),
    path('admin/orders/', views.AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/projects/', views.AdminProjectListView.as_view(), name='admin-project-list'),
    path('admin/transactions/', views.AdminTransactionListView.as_view(), name='admin-transaction-list'),
    path('admin/activity/', views.AdminActivityListView.as_view(), name='admin-activity-list'),
    
    # Dispute Management URLs
    path('disputes/', views.DisputeListView.as_view(), name='dispute-list'),
    path('disputes/create/', views.DisputeCreateView.as_view(), name='dispute-create'),
    path('disputes/<int:pk>/', views.DisputeDetailView.as_view(), name='dispute-detail'),
    path('disputes/<int:dispute_id>/resolve/', views.resolve_dispute, name='resolve-dispute'),
    
    # Content Moderation URLs
    path('reports/', views.ContentReportListView.as_view(), name='content-report-list'),
    path('reports/create/', views.ContentReportCreateView.as_view(), name='content-report-create'),
    path('reports/<int:pk>/', views.ContentReportDetailView.as_view(), name='content-report-detail'),
    path('reports/<int:report_id>/moderate/', views.moderate_content, name='moderate-content'),
    
    # System Settings URLs
    path('admin/settings/', views.SystemSettingsListView.as_view(), name='system-settings-list'),
    path('admin/settings/<str:key>/', views.SystemSettingsUpdateView.as_view(), name='system-settings-update'),
    
    # Admin Action Log URLs
    path('admin/actions/', views.AdminActionListView.as_view(), name='admin-action-list'),
    
    # Enhanced Notification URLs
    path('notifications/real-time/', views.real_time_notifications, name='real-time-notifications'),
    path('notifications/preferences/', views.NotificationPreferenceListView.as_view(), name='notification-preferences'),
    path('notifications/preferences/<int:pk>/', views.NotificationPreferenceUpdateView.as_view(), name='notification-preference-update'),
    path('notifications/preferences/update/', views.update_notification_preferences, name='update-notification-preferences'),
    path('notifications/settings/', views.get_notification_settings, name='notification-settings'),
    
    # Notification Templates (Admin)
    path('admin/notification-templates/', views.NotificationTemplateListView.as_view(), name='notification-template-list'),
    path('admin/notification-templates/<int:pk>/', views.NotificationTemplateDetailView.as_view(), name='notification-template-detail'),
    path('admin/send-system-notification/', views.send_system_notification, name='send-system-notification'),
    
    # Error Handling & Recovery URLs
    path('errors/log/', views.log_error, name='log-error'),
    path('auth/refresh/', views.refresh_token, name='refresh-token'),
    path('auth/session-status/', views.session_status, name='session-status'),
    
    # Error Management (Admin)
    path('admin/errors/', views.ErrorLogListView.as_view(), name='error-log-list'),
    path('admin/errors/<int:error_id>/resolve/', views.mark_error_resolved, name='mark-error-resolved'),
    
    # Analytics URLs
    path('analytics/user/', views.user_analytics, name='user-analytics'),
    path('analytics/performance/', views.user_performance_metrics, name='user-performance-metrics'),
    path('analytics/track/', views.track_event, name='track-event'),
    path('analytics/platform/', views.platform_analytics, name='platform-analytics'),
    
    # Integration URLs
    path('integrations/', views.list_integrations, name='list-integrations'),
    path('integrations/available/', views.available_integrations, name='available-integrations'),
    path('integrations/connect/', views.connect_integration, name='connect-integration'),
    path('integrations/<str:provider>/disconnect/', views.disconnect_integration, name='disconnect-integration'),
    path('integrations/<str:provider>/sync/', views.sync_integration, name='sync-integration'),
    path('integrations/<str:provider>/history/', views.integration_sync_history, name='integration-sync-history'),
    
    # WebSocket Status URL
    path('websocket/status/', views.websocket_status, name='websocket-status'),
    
    # Like/Dislike URLs
    path('likes/toggle/', views.toggle_like, name='toggle-like'),
    path('likes/<str:content_type>/<int:object_id>/', views.get_like_status, name='get-like-status'),
    
    # Contact & Feedback URLs
    path('contact/submit/', views.submit_contact_form, name='submit-contact-form'),
    path('feedback/submit/', views.submit_feedback_form, name='submit-feedback-form'),
    
    # AI Assistant URLs
    path('ai/conversation/', views.AIConversationView.as_view(), name='ai-conversation'),
    path('ai/messages/save/', views.save_ai_message, name='save-ai-message'),
    path('ai/conversation/get/', views.get_ai_conversation, name='get-ai-conversation'),
    path('ai/conversation/clear/', views.clear_ai_conversation, name='clear-ai-conversation'),
    
    # Database Debug URLs
    path('debug/tables/', views.get_database_tables, name='get-database-tables'),
    
    # Debug URLs
    path('debug/enrollment/<int:course_id>/', views.debug_enrollment_status, name='debug-enrollment-status'),
    path('debug/conversations/<int:conversation_id>/messages/', views.debug_conversation_messages, name='debug-conversation-messages'),
    path('debug/conversations/<int:conversation_id>/refresh/', views.force_refresh_conversation, name='force-refresh-conversation'),
    
    # Location API URLs
    path('location/coordinates/', get_location_by_coordinates, name='location-by-coordinates'),
    path('location/ip/', get_location_by_ip, name='location-by-ip'),
    
    # Professional Profile URLs
    path('profiles/freelancer/', freelancer_profile_view, name='freelancer-profile'),
    path('profiles/freelancer/<int:user_id>/', views.get_freelancer_profile_by_id, name='freelancer-profile-by-id'),
    path('profiles/client/', client_profile_view, name='client-profile'),
    path('profiles/client/<int:user_id>/', views.get_client_profile_by_id, name='client-profile-by-id'),
    path('profiles/freelancers/public/', public_freelancer_profiles, name='public-freelancer-profiles'),
    
    # User Verification System URLs
    path('verification/', include('api.verification_urls')),
    
    # Reporting System URLs
    path('', include('api.report_urls')),
    
    # Support Ticket System URLs
    path('', include('api.ticket_urls')),
    
    # Admin Ticket Management URLs
    path('admin/tickets/', AdminTicketListView.as_view(), name='admin-ticket-list'),
    path('admin/tickets/<int:pk>/', AdminTicketDetailView.as_view(), name='admin-ticket-detail'),
    path('admin/tickets/stats/', admin_ticket_stats, name='admin-ticket-stats'),
    path('admin/tickets/<int:ticket_id>/reply/', admin_reply_ticket, name='admin-ticket-reply'),
    path('admin/tickets/<int:ticket_id>/assign/', assign_ticket, name='admin-assign-ticket'),
    path('admin/tickets/<int:ticket_id>/status/', update_ticket_status, name='admin-update-ticket-status'),
    path('admin/tickets/<int:ticket_id>/custom-notification/', send_custom_notification, name='admin-custom-notification'),
    
    # Referral System URLs
    path('referrals/', include('api.referral_urls')),
    
    # Skill Assessment System URLs
    path('assessments/categories/', assessment_views.AssessmentCategoryListView.as_view(), name='assessment-categories'),
    path('assessments/', assessment_views.AssessmentListView.as_view(), name='skill-assessments'),
    path('assessments/<int:pk>/', assessment_views.AssessmentDetailView.as_view(), name='skill-assessment-detail'),
    path('assessments/payments/', assessment_views.AssessmentPaymentListCreateView.as_view(), name='assessment-payments'),
    path('assessments/payment/verify/', assessment_views.verify_assessment_payment, name='assessment-payment-verify'),
    path('assessments/<int:assessment_id>/start/', assessment_views.start_assessment, name='start-skill-assessment'),
    path('assessments/<int:assessment_id>/questions/', assessment_views.get_assessment_questions, name='assessment-questions'),
    path('assessments/attempts/<int:attempt_id>/answer/', assessment_views.submit_answer, name='submit-assessment-answer'),
    path('assessments/attempts/<int:attempt_id>/submit/', assessment_views.submit_assessment, name='submit-skill-assessment'),
    path('assessments/attempts/<int:attempt_id>/result/', assessment_views.get_assessment_result, name='assessment-result'),
    path('assessments/attempts/', assessment_views.user_assessment_history, name='my-assessment-attempts'),
    path('assessments/my-badges/', assessment_views.get_user_badges, name='my-skill-badges'),
    
    # Admin Assessment Management URLs
    path('admin/assessments/', assessment_views.AdminAssessmentListView.as_view(), name='admin-assessments'),
    path('admin/assessments/<int:pk>/', assessment_views.AdminAssessmentDetailView.as_view(), name='admin-assessment-detail'),
    path('admin/assessments/attempts/', assessment_views.AdminAssessmentAttemptListView.as_view(), name='admin-assessment-attempts'),
    path('admin/assessments/analytics/', assessment_views.assessment_analytics, name='assessment-analytics'),
    
    # Admin Question Management URLs
    path('admin/assessments/questions/', assessment_views.create_question, name='admin-create-question'),
    path('admin/assessments/questions/<int:pk>/', assessment_views.AdminQuestionDetailView.as_view(), name='admin-question-detail'),
    path('admin/assessments/questions/<int:question_id>/', assessment_views.delete_question, name='admin-delete-question'),
    path('admin/assessments/question-options/', assessment_views.create_question_option, name='admin-create-question-option'),
    path('admin/assessments/<int:assessment_id>/questions/', assessment_views.get_assessment_questions_admin, name='admin-assessment-questions'),
    path('assessments/questions/', assessment_views.create_question, name='create-question'),
    path('assessments/question-options/', assessment_views.create_question_option, name='create-question-option'),
    path('assessments/questions/<int:question_id>/', assessment_views.delete_question, name='delete-question'),
    

]

