from django.urls import path
from . import report_views

urlpatterns = [
    # Report creation and management
    path('reports/create/', report_views.create_report, name='create_report'),
    path('reports/', report_views.list_reports, name='list_reports'),
    path('reports/<int:report_id>/', report_views.get_report, name='get_report'),
    path('reports/<int:report_id>/action/', report_views.take_report_action, name='take_report_action'),
    path('reports/<int:report_id>/update/', report_views.update_report, name='update_report'),
    
    # Statistics and user reports
    path('reports/statistics/', report_views.report_statistics, name='report_statistics'),
    path('reports/my-reports/', report_views.my_reports, name='my_reports'),
]