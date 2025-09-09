from django.urls import path
from . import newsletter_views

urlpatterns = [
    # Public newsletter endpoints
    path('newsletter/subscribe/', newsletter_views.subscribe_newsletter, name='newsletter-subscribe'),
    path('newsletter/verify/<str:token>/', newsletter_views.verify_newsletter_subscription, name='newsletter-verify'),
    path('newsletter/unsubscribe/<str:token>/', newsletter_views.unsubscribe_newsletter, name='newsletter-unsubscribe'),
    path('newsletter/track/open/<str:tracking_id>/', newsletter_views.track_newsletter_open, name='newsletter-track-open'),
    
    # Admin newsletter management
    path('admin/newsletter/subscribers/', newsletter_views.NewsletterSubscriberListView.as_view(), name='admin-newsletter-subscribers'),
    path('admin/newsletter/', newsletter_views.NewsletterListCreateView.as_view(), name='admin-newsletter-list'),
    path('admin/newsletter/<int:pk>/', newsletter_views.NewsletterDetailView.as_view(), name='admin-newsletter-detail'),
    path('admin/newsletter/<int:newsletter_id>/send/', newsletter_views.send_newsletter, name='admin-newsletter-send'),
    path('admin/newsletter/templates/', newsletter_views.NewsletterTemplateListCreateView.as_view(), name='admin-newsletter-templates'),
    path('admin/newsletter/content/', newsletter_views.NewsletterContentListCreateView.as_view(), name='admin-newsletter-content'),
    path('admin/newsletter/analytics/', newsletter_views.newsletter_analytics, name='admin-newsletter-analytics'),
]