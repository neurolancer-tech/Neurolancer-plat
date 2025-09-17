from django.urls import path
from . import ticket_views

urlpatterns = [
    path('tickets/', ticket_views.TicketListCreateView.as_view(), name='ticket-list-create'),
    path('tickets/<int:pk>/', ticket_views.TicketDetailView.as_view(), name='ticket-detail'),
    path('tickets/<int:ticket_id>/reply/', ticket_views.add_ticket_reply, name='ticket-reply'),
    path('tickets/stats/', ticket_views.ticket_stats, name='ticket-stats'),
]