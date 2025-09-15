from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0031_add_firebase_session_info'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FreelancerProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, max_length=200)),
                ('bio', models.TextField(blank=True)),
                ('hourly_rate', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('availability', models.CharField(choices=[('full_time', 'Full Time'), ('part_time', 'Part Time'), ('contract', 'Contract'), ('freelance', 'Freelance')], default='freelance', max_length=50)),
                ('skills', models.TextField(blank=True, help_text='Comma-separated skills')),
                ('experience_years', models.IntegerField(default=0)),
                ('portfolio_url', models.URLField(blank=True)),
                ('github_url', models.URLField(blank=True)),
                ('linkedin_url', models.URLField(blank=True)),
                ('rating', models.DecimalField(decimal_places=2, default=0.0, max_digits=3)),
                ('total_reviews', models.IntegerField(default=0)),
                ('completed_projects', models.IntegerField(default=0)),
                ('response_time', models.CharField(default='Within 24 hours', max_length=50)),
                ('is_active', models.BooleanField(default=True)),
                ('is_verified', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='freelancer_profile', to=settings.AUTH_USER_MODEL)),
                ('user_profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='freelancer_profiles', to='api.userprofile')),
            ],
            options={
                'db_table': 'freelancer_profiles',
            },
        ),
        migrations.CreateModel(
            name='ClientProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('company_name', models.CharField(blank=True, max_length=200)),
                ('company_size', models.CharField(blank=True, choices=[('1-10', '1-10 employees'), ('11-50', '11-50 employees'), ('51-200', '51-200 employees'), ('201-500', '201-500 employees'), ('500+', '500+ employees')], max_length=50)),
                ('industry', models.CharField(blank=True, max_length=100)),
                ('website_url', models.URLField(blank=True)),
                ('typical_budget', models.CharField(blank=True, choices=[('under_1k', 'Under $1,000'), ('1k_5k', '$1,000 - $5,000'), ('5k_10k', '$5,000 - $10,000'), ('10k_25k', '$10,000 - $25,000'), ('25k_plus', '$25,000+')], max_length=50)),
                ('project_types', models.TextField(blank=True, help_text='Types of projects typically posted')),
                ('total_projects_posted', models.IntegerField(default=0)),
                ('total_spent', models.DecimalField(decimal_places=2, default=0.0, max_digits=12)),
                ('avg_rating_given', models.DecimalField(decimal_places=2, default=0.0, max_digits=3)),
                ('is_active', models.BooleanField(default=True)),
                ('is_verified', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='client_profile', to=settings.AUTH_USER_MODEL)),
                ('user_profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='client_profiles', to='api.userprofile')),
            ],
            options={
                'db_table': 'client_profiles',
            },
        ),
    ]