from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .ticket_models import SupportTicket, TicketReply
from .ticket_serializers import SupportTicketSerializer, CreateTicketSerializer, TicketReplySerializer
from .notification_service import NotificationService

class TicketListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateTicketSerializer
        return SupportTicketSerializer
    
    def perform_create(self, serializer):
        ticket = serializer.save(user=self.request.user)
        
        # Send ticket creation notifications
        NotificationService.send_ticket_notification(ticket, 'created')

class TicketDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SupportTicketSerializer
    
    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_ticket_reply(request, ticket_id):
    ticket = get_object_or_404(SupportTicket, id=ticket_id, user=request.user)
    
    serializer = TicketReplySerializer(data=request.data)
    if serializer.is_valid():
        reply = serializer.save(
            ticket=ticket,
            user=request.user,
            is_staff_reply=False
        )
        
        # Update ticket status
        old_status = ticket.status
        if ticket.status == 'waiting_response':
            ticket.status = 'in_progress'
            ticket.save()
            
            # Send status update notification if changed
            if old_status != ticket.status:
                NotificationService.send_ticket_notification(ticket, 'status_updated')
        
        # Send reply notification
        NotificationService.send_ticket_notification(ticket, 'reply_added', message=reply.message)
        
        return Response(TicketReplySerializer(reply).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ticket_stats(request):
    user_tickets = SupportTicket.objects.filter(user=request.user)
    
    stats = {
        'total_tickets': user_tickets.count(),
        'open_tickets': user_tickets.filter(status='open').count(),
        'in_progress_tickets': user_tickets.filter(status='in_progress').count(),
        'resolved_tickets': user_tickets.filter(status='resolved').count(),
        'closed_tickets': user_tickets.filter(status='closed').count(),
    }
    
    return Response(stats)