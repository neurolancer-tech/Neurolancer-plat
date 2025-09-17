from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Count, Q
from .ticket_models import SupportTicket, TicketReply
from .ticket_serializers import SupportTicketSerializer, TicketReplySerializer

class AdminTicketListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = SupportTicketSerializer
    
    def get_queryset(self):
        queryset = SupportTicket.objects.all().select_related('user', 'assigned_to')
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
            
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
            
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(ticket_id__icontains=search) |
                Q(subject__icontains=search) |
                Q(description__icontains=search) |
                Q(user__username__icontains=search)
            )
            
        return queryset.order_by('-created_at')

class AdminTicketDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = SupportTicketSerializer
    queryset = SupportTicket.objects.all()

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_ticket_stats(request):
    stats = {
        'total_tickets': SupportTicket.objects.count(),
        'open_tickets': SupportTicket.objects.filter(status='open').count(),
        'in_progress_tickets': SupportTicket.objects.filter(status='in_progress').count(),
        'waiting_response_tickets': SupportTicket.objects.filter(status='waiting_response').count(),
        'resolved_tickets': SupportTicket.objects.filter(status='resolved').count(),
        'closed_tickets': SupportTicket.objects.filter(status='closed').count(),
    }
    
    # Tickets by category
    tickets_by_category = list(
        SupportTicket.objects.values('category')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    
    # Tickets by priority
    tickets_by_priority = list(
        SupportTicket.objects.values('priority')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    
    stats['tickets_by_category'] = tickets_by_category
    stats['tickets_by_priority'] = tickets_by_priority
    
    return Response(stats)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_reply_ticket(request, ticket_id):
    ticket = get_object_or_404(SupportTicket, id=ticket_id)
    
    serializer = TicketReplySerializer(data=request.data)
    if serializer.is_valid():
        reply = serializer.save(
            ticket=ticket,
            user=request.user,
            is_staff_reply=True
        )
        
        # Update ticket status if needed
        old_status = ticket.status
        if ticket.status == 'open':
            ticket.status = 'in_progress'
        elif ticket.status == 'waiting_response':
            ticket.status = 'in_progress'
        ticket.save()
        
        # Send notifications
        if old_status != ticket.status:
            from .notification_service import NotificationService
            NotificationService.send_ticket_notification(ticket, 'status_updated')
        
        from .notification_service import NotificationService
        NotificationService.send_ticket_notification(ticket, 'reply_added', admin_user=request.user, message=reply.message)
        
        return Response(TicketReplySerializer(reply).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def assign_ticket(request, ticket_id):
    ticket = get_object_or_404(SupportTicket, id=ticket_id)
    
    admin_id = request.data.get('assigned_to')
    if admin_id:
        admin = get_object_or_404(User, id=admin_id, is_staff=True)
        ticket.assigned_to = admin
    else:
        ticket.assigned_to = None
    
    ticket.save()
    
    # Send assignment notification
    from .notification_service import NotificationService
    NotificationService.send_ticket_notification(ticket, 'assigned')
    
    return Response(SupportTicketSerializer(ticket).data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_ticket_status(request, ticket_id):
    ticket = get_object_or_404(SupportTicket, id=ticket_id)
    
    new_status = request.data.get('status')
    if new_status in dict(SupportTicket.STATUS_CHOICES):
        ticket.status = new_status
        
        # Set resolved_at if resolving
        if new_status == 'resolved' and not ticket.resolved_at:
            from django.utils import timezone
            ticket.resolved_at = timezone.now()
            
        ticket.save()
        
        # Send status update notification
        from .notification_service import NotificationService
        NotificationService.send_ticket_notification(ticket, 'status_updated')
        
        return Response(SupportTicketSerializer(ticket).data)
    
    return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def send_custom_notification(request, ticket_id):
    ticket = get_object_or_404(SupportTicket, id=ticket_id)
    
    message = request.data.get('message', '').strip()
    if not message:
        return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Send custom notification
    from .notification_service import NotificationService
    NotificationService.send_ticket_notification(ticket, 'custom_reply', message=message)
    
    return Response({'message': 'Custom notification sent successfully'}, status=status.HTTP_200_OK)