from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
import logging

from .models import Gig, Job, Order, UserProfile, Notification
from .report_models import Report, ReportAction, UserReportStats
from .notification_service import NotificationService

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_report(request):
    """Create a new report"""
    try:
        data = request.data
        reporter = request.user
        
        # Validate required fields
        required_fields = ['report_type', 'category', 'title', 'description']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'{field} is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create report
        report = Report.objects.create(
            reporter=reporter,
            report_type=data['report_type'],
            category=data['category'],
            title=data['title'],
            description=data['description'],
            content_url=data.get('content_url', ''),
            severity=data.get('severity', 'medium')
        )
        
        # Handle specific report types
        if data['report_type'] == 'gig' and data.get('gig_id'):
            gig = get_object_or_404(Gig, id=data['gig_id'])
            report.reported_gig = gig
            report.reported_user = gig.freelancer
            
        elif data['report_type'] == 'job' and data.get('job_id'):
            job = get_object_or_404(Job, id=data['job_id'])
            report.reported_job = job
            report.reported_user = job.client
            
        elif data['report_type'] == 'order' and data.get('order_id'):
            order = get_object_or_404(Order, id=data['order_id'])
            report.reported_order = order
            report.reported_user = order.freelancer
            
        elif data['report_type'] in ['freelancer', 'client'] and data.get('user_id'):
            reported_user = get_object_or_404(User, id=data['user_id'])
            report.reported_user = reported_user
        
        report.save()
        
        # Update user report stats
        if report.reported_user:
            stats, created = UserReportStats.objects.get_or_create(
                user=report.reported_user
            )
            stats.update_stats()
            
            # Notify reported user (without revealing reporter)
            NotificationService.create_notification(
                user=report.reported_user,
                title="Content Report Received",
                message=f"A report has been filed regarding your {report.report_type}. Our team will review it shortly.",
                notification_type='system',
                action_url='/profile'
            )
        
        # Notify admins
        admin_users = User.objects.filter(is_staff=True, is_active=True)
        for admin in admin_users:
            NotificationService.create_notification(
                user=admin,
                title=f"New Report: {report.title}",
                message=f"A new {report.report_type} report has been filed by {reporter.username}",
                notification_type='system',
                action_url=f'/admin/reports',
                related_object_id=report.id
            )
        
        return Response({
            'message': 'Report submitted successfully',
            'report_id': report.id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating report: {e}")
        return Response({
            'error': 'Failed to submit report'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def list_reports(request):
    """List all reports for admin"""
    try:
        reports = Report.objects.select_related(
            'reporter', 'reported_user', 'assigned_admin',
            'reported_gig', 'reported_job', 'reported_order'
        ).all()
        
        # Filter by status
        status_filter = request.GET.get('status')
        if status_filter:
            reports = reports.filter(status=status_filter)
        
        # Filter by type
        type_filter = request.GET.get('type')
        if type_filter:
            reports = reports.filter(report_type=type_filter)
        
        # Filter by severity
        severity_filter = request.GET.get('severity')
        if severity_filter:
            reports = reports.filter(severity=severity_filter)
        
        # Search
        search = request.GET.get('search')
        if search:
            reports = reports.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(reporter__username__icontains=search) |
                Q(reported_user__username__icontains=search)
            )
        
        # Pagination
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        start = (page - 1) * per_page
        end = start + per_page
        
        total_count = reports.count()
        reports_page = reports[start:end]
        
        # Serialize reports
        reports_data = []
        for report in reports_page:
            content_details = report.get_reported_content_details()
            
            reports_data.append({
                'id': report.id,
                'title': report.title,
                'description': report.description,
                'report_type': report.report_type,
                'category': report.category,
                'severity': report.severity,
                'status': report.status,
                'reporter': {
                    'id': report.reporter.id,
                    'username': report.reporter.username,
                    'email': report.reporter.email
                },
                'reported_user': {
                    'id': report.reported_user.id,
                    'username': report.reported_user.username,
                    'email': report.reported_user.email
                } if report.reported_user else None,
                'content_details': content_details,
                'content_url': report.content_url,
                'assigned_admin': {
                    'id': report.assigned_admin.id,
                    'username': report.assigned_admin.username
                } if report.assigned_admin else None,
                'admin_notes': report.admin_notes,
                'resolution_notes': report.resolution_notes,
                'created_at': report.created_at.isoformat(),
                'updated_at': report.updated_at.isoformat(),
                'resolved_at': report.resolved_at.isoformat() if report.resolved_at else None
            })
        
        return Response({
            'reports': reports_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'pages': (total_count + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Error listing reports: {e}")
        return Response({
            'error': 'Failed to fetch reports'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def get_report(request, report_id):
    """Get detailed report information"""
    try:
        report = get_object_or_404(
            Report.objects.select_related(
                'reporter', 'reported_user', 'assigned_admin',
                'reported_gig', 'reported_job', 'reported_order'
            ),
            id=report_id
        )
        
        # Get report actions
        actions = ReportAction.objects.filter(report=report).select_related('admin')
        actions_data = [{
            'id': action.id,
            'action_type': action.action_type,
            'action_description': action.action_description,
            'custom_message': action.custom_message,
            'admin': {
                'id': action.admin.id,
                'username': action.admin.username
            },
            'created_at': action.created_at.isoformat()
        } for action in actions]
        
        # Get user report stats if reported user exists
        user_stats = None
        if report.reported_user:
            stats, created = UserReportStats.objects.get_or_create(
                user=report.reported_user
            )
            if created:
                stats.update_stats()
            
            user_stats = {
                'total_reports_received': stats.total_reports_received,
                'reports_last_30_days': stats.reports_last_30_days,
                'reports_last_7_days': stats.reports_last_7_days,
                'risk_level': stats.risk_level,
                'is_flagged': stats.is_flagged,
                'warnings_received': stats.warnings_received,
                'content_removals': stats.content_removals,
                'suspensions_count': stats.suspensions_count
            }
        
        content_details = report.get_reported_content_details()
        
        return Response({
            'id': report.id,
            'title': report.title,
            'description': report.description,
            'report_type': report.report_type,
            'category': report.category,
            'severity': report.severity,
            'status': report.status,
            'reporter': {
                'id': report.reporter.id,
                'username': report.reporter.username,
                'email': report.reporter.email
            },
            'reported_user': {
                'id': report.reported_user.id,
                'username': report.reported_user.username,
                'email': report.reported_user.email,
                'full_name': report.reported_user.get_full_name()
            } if report.reported_user else None,
            'content_details': content_details,
            'content_url': report.content_url,
            'evidence_file': report.evidence_file.url if report.evidence_file else None,
            'assigned_admin': {
                'id': report.assigned_admin.id,
                'username': report.assigned_admin.username
            } if report.assigned_admin else None,
            'admin_notes': report.admin_notes,
            'resolution_notes': report.resolution_notes,
            'actions': actions_data,
            'user_stats': user_stats,
            'created_at': report.created_at.isoformat(),
            'updated_at': report.updated_at.isoformat(),
            'resolved_at': report.resolved_at.isoformat() if report.resolved_at else None
        })
        
    except Exception as e:
        logger.error(f"Error getting report: {e}")
        return Response({
            'error': 'Failed to fetch report'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def take_report_action(request, report_id):
    """Take action on a report"""
    try:
        report = get_object_or_404(Report, id=report_id)
        data = request.data
        admin = request.user
        
        action_type = data.get('action_type')
        action_description = data.get('action_description', '')
        custom_message = data.get('custom_message', '')
        
        if not action_type:
            return Response({
                'error': 'action_type is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create report action
        action = ReportAction.objects.create(
            report=report,
            action_type=action_type,
            action_description=action_description,
            custom_message=custom_message,
            admin=admin
        )
        
        # Update report status and assignment
        if not report.assigned_admin:
            report.assigned_admin = admin
        
        if action_type in ['warning', 'content_removal', 'account_suspension', 'account_deactivation']:
            report.status = 'resolved'
            report.resolved_at = timezone.now()
        elif action_type == 'escalated':
            report.status = 'escalated'
        elif action_type == 'no_action':
            report.status = 'dismissed'
            report.resolved_at = timezone.now()
        else:
            report.status = 'investigating'
        
        report.save()
        
        # Send notifications based on action type
        if report.reported_user and action_type != 'no_action':
            if action_type == 'warning':
                title = "Warning Issued"
                message = f"You have received a warning regarding your {report.report_type}. Please review our community guidelines."
                if custom_message:
                    message += f"\n\nAdditional message: {custom_message}"
                    
            elif action_type == 'content_removal':
                title = "Content Removed"
                message = f"Your {report.report_type} has been removed due to policy violations."
                if custom_message:
                    message += f"\n\nReason: {custom_message}"
                    
            elif action_type == 'account_suspension':
                title = "Account Suspended"
                message = "Your account has been temporarily suspended. Please contact support for more information."
                if custom_message:
                    message += f"\n\nDetails: {custom_message}"
                    
            elif action_type == 'account_deactivation':
                title = "Account Deactivated"
                message = "Your account has been deactivated due to policy violations."
                if custom_message:
                    message += f"\n\nReason: {custom_message}"
                    
            elif action_type == 'custom_message':
                title = "Message from Neurolancer Team"
                message = custom_message or "You have received a message from our moderation team."
            
            else:
                title = "Account Update"
                message = "There has been an update to your account status."
            
            NotificationService.create_notification(
                user=report.reported_user,
                title=title,
                message=message,
                notification_type='system',
                action_url='/profile'
            )
        
        # Update user report stats
        if report.reported_user:
            stats, created = UserReportStats.objects.get_or_create(
                user=report.reported_user
            )
            stats.update_stats()
        
        return Response({
            'message': 'Action taken successfully',
            'action_id': action.id,
            'report_status': report.status
        })
        
    except Exception as e:
        logger.error(f"Error taking report action: {e}")
        return Response({
            'error': 'Failed to take action'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([permissions.IsAdminUser])
def update_report(request, report_id):
    """Update report details"""
    try:
        report = get_object_or_404(Report, id=report_id)
        data = request.data
        
        # Update allowed fields
        if 'status' in data:
            report.status = data['status']
            if data['status'] in ['resolved', 'dismissed']:
                report.resolved_at = timezone.now()
        
        if 'severity' in data:
            report.severity = data['severity']
        
        if 'assigned_admin_id' in data:
            if data['assigned_admin_id']:
                admin = get_object_or_404(User, id=data['assigned_admin_id'], is_staff=True)
                report.assigned_admin = admin
            else:
                report.assigned_admin = None
        
        if 'admin_notes' in data:
            report.admin_notes = data['admin_notes']
        
        if 'resolution_notes' in data:
            report.resolution_notes = data['resolution_notes']
        
        report.save()
        
        return Response({
            'message': 'Report updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating report: {e}")
        return Response({
            'error': 'Failed to update report'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def report_statistics(request):
    """Get report statistics for dashboard"""
    try:
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        last_7_days = now - timedelta(days=7)
        
        # Basic counts
        total_reports = Report.objects.count()
        pending_reports = Report.objects.filter(status='pending').count()
        resolved_reports = Report.objects.filter(status='resolved').count()
        
        # Recent reports
        reports_last_30_days = Report.objects.filter(created_at__gte=last_30_days).count()
        reports_last_7_days = Report.objects.filter(created_at__gte=last_7_days).count()
        
        # By type
        reports_by_type = Report.objects.values('report_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # By category
        reports_by_category = Report.objects.values('category').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # By severity
        reports_by_severity = Report.objects.values('severity').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # High-risk users
        high_risk_users = UserReportStats.objects.filter(
            risk_level__in=['high', 'critical']
        ).count()
        
        return Response({
            'total_reports': total_reports,
            'pending_reports': pending_reports,
            'resolved_reports': resolved_reports,
            'reports_last_30_days': reports_last_30_days,
            'reports_last_7_days': reports_last_7_days,
            'reports_by_type': list(reports_by_type),
            'reports_by_category': list(reports_by_category),
            'reports_by_severity': list(reports_by_severity),
            'high_risk_users': high_risk_users
        })
        
    except Exception as e:
        logger.error(f"Error getting report statistics: {e}")
        return Response({
            'error': 'Failed to fetch statistics'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_reports(request):
    """Get reports filed by the current user"""
    try:
        reports = Report.objects.filter(reporter=request.user).order_by('-created_at')
        
        reports_data = []
        for report in reports:
            content_details = report.get_reported_content_details()
            
            reports_data.append({
                'id': report.id,
                'title': report.title,
                'report_type': report.report_type,
                'category': report.category,
                'status': report.status,
                'severity': report.severity,
                'content_details': content_details,
                'created_at': report.created_at.isoformat(),
                'resolved_at': report.resolved_at.isoformat() if report.resolved_at else None
            })
        
        return Response({
            'reports': reports_data
        })
        
    except Exception as e:
        logger.error(f"Error getting user reports: {e}")
        return Response({
            'error': 'Failed to fetch reports'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)