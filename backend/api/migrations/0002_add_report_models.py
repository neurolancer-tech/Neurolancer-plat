# Generated migration for report models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Report',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('report_type', models.CharField(choices=[('gig', 'Gig Report'), ('job', 'Job Report'), ('freelancer', 'Freelancer Report'), ('client', 'Client Report'), ('order', 'Order Report'), ('message', 'Message Report'), ('general', 'General Report')], max_length=20)),
                ('category', models.CharField(choices=[('inappropriate_content', 'Inappropriate Content'), ('spam', 'Spam'), ('fraud', 'Fraud/Scam'), ('harassment', 'Harassment'), ('copyright', 'Copyright Violation'), ('fake_profile', 'Fake Profile'), ('poor_quality', 'Poor Quality Work'), ('payment_issue', 'Payment Issue'), ('communication_issue', 'Communication Issue'), ('other', 'Other')], max_length=30)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('content_url', models.URLField(blank=True, help_text='URL of the reported content')),
                ('evidence_file', models.FileField(blank=True, null=True, upload_to='report_evidence/')),
                ('status', models.CharField(choices=[('pending', 'Pending Review'), ('investigating', 'Under Investigation'), ('resolved', 'Resolved'), ('dismissed', 'Dismissed'), ('escalated', 'Escalated')], default='pending', max_length=15)),
                ('severity', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', max_length=10)),
                ('admin_notes', models.TextField(blank=True)),
                ('resolution_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('assigned_admin', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='user_reports_assigned', to=settings.AUTH_USER_MODEL)),
                ('reported_gig', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='reports', to='api.gig')),
                ('reported_job', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='reports', to='api.job')),
                ('reported_order', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='reports', to='api.order')),
                ('reported_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='user_reports_received', to=settings.AUTH_USER_MODEL)),
                ('reporter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_reports_filed', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='UserReportStats',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_reports_received', models.IntegerField(default=0)),
                ('reports_last_30_days', models.IntegerField(default=0)),
                ('reports_last_7_days', models.IntegerField(default=0)),
                ('low_severity_reports', models.IntegerField(default=0)),
                ('medium_severity_reports', models.IntegerField(default=0)),
                ('high_severity_reports', models.IntegerField(default=0)),
                ('critical_severity_reports', models.IntegerField(default=0)),
                ('warnings_received', models.IntegerField(default=0)),
                ('content_removals', models.IntegerField(default=0)),
                ('suspensions_count', models.IntegerField(default=0)),
                ('is_flagged', models.BooleanField(default=False, help_text='User flagged for review')),
                ('risk_level', models.CharField(choices=[('low', 'Low Risk'), ('medium', 'Medium Risk'), ('high', 'High Risk'), ('critical', 'Critical Risk')], default='low', max_length=10)),
                ('last_report_date', models.DateTimeField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='report_stats', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ReportAction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action_type', models.CharField(choices=[('warning', 'Warning Sent'), ('content_removal', 'Content Removed'), ('account_suspension', 'Account Suspended'), ('account_deactivation', 'Account Deactivated'), ('custom_message', 'Custom Message Sent'), ('no_action', 'No Action Required'), ('escalated', 'Escalated to Senior Admin')], max_length=25)),
                ('action_description', models.TextField()),
                ('custom_message', models.TextField(blank=True, help_text='Custom message sent to reported user')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('admin', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_report_actions_taken', to=settings.AUTH_USER_MODEL)),
                ('report', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='actions', to='api.report')),
            ],
        ),
        migrations.AddIndex(
            model_name='report',
            index=models.Index(fields=['status', 'created_at'], name='api_report_status_created_idx'),
        ),
        migrations.AddIndex(
            model_name='report',
            index=models.Index(fields=['reported_user', 'status'], name='api_report_reported_user_status_idx'),
        ),
        migrations.AddIndex(
            model_name='report',
            index=models.Index(fields=['report_type', 'category'], name='api_report_type_category_idx'),
        ),
    ]