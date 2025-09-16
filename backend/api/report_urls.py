from django.urls import path
from . import report_views

urlpatterns = [
    # Report creation and management
    path('user-reports/create/', report_views.create_report, name='create_report'),
    path('user-reports/', report_views.list_reports, name='list_reports'),
    path('user-reports/<int:report_id>/', report_views.get_report, name='get_report'),
    path('user-reports/<int:report_id>/action/', report_views.take_report_action, name='take_report_action'),
    path('user-reports/<int:report_id>/update/', report_views.update_report, name='update_report'),
    
    # Statistics and user reports
    path('user-reports/statistics/', report_views.report_statistics, name='report_statistics'),
    path('user-reports/my-reports/', report_views.my_reports, name='my_reports'),
]