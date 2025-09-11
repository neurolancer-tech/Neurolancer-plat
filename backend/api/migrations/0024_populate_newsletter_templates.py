from django.db import migrations
from django.contrib.auth.models import User
import os

def populate_newsletter_templates(apps, schema_editor):
    """Populate newsletter templates from HTML files"""
    NewsletterTemplate = apps.get_model('api', 'NewsletterTemplate')
    
    # Get or create admin user for template creation
    try:
        admin_user = User.objects.get(username='admin')
    except User.DoesNotExist:
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@neurolancer.com',
            is_staff=True,
            is_superuser=True
        )
    
    templates_data = [
        {
            'name': 'Professional Clean',
            'template_type': 'weekly_digest',
            'description': 'Clean and professional template with gradient header and white logo',
            'html_content': '''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neurolancer Newsletter</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
        <img src="https://neurolancer-5jxf.vercel.app/assets/Neurolancer-logo/vector/default-monochrome-white.svg" alt="Neurolancer" style="height: 50px; margin-bottom: 15px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">AI Freelance Marketplace</h1>
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 40px 30px;">
        <h2 style="color: #2563eb; margin-top: 0; font-size: 24px;">{{SUBJECT_TITLE}}</h2>
        
        <div style="color: #4b5563; font-size: 16px; line-height: 1.7;">
            {{CONTENT_AREA}}
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="{{CTA_LINK}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                {{CTA_TEXT}}
            </a>
        </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 0 0 15px 0;">You received this email because you subscribed to Neurolancer updates.</p>
        <p style="margin: 0;">
            <a href="{{UNSUBSCRIBE_LINK}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> | 
            <a href="https://neurolancer-5jxf.vercel.app" style="color: #6b7280; text-decoration: underline;">Visit Neurolancer</a>
        </p>
    </div>
</body>
</html>''',
            'is_default': True
        },
        {
            'name': 'Feature Highlight',
            'template_type': 'featured_content',
            'description': 'Template with feature boxes and card-based design',
            'html_content': '''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neurolancer Newsletter</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f1f5f9;">
    <!-- Header with Side Logo -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; display: flex; align-items: center; justify-content: space-between;">
        <div style="flex: 1;">
            <img src="https://neurolancer-5jxf.vercel.app/assets/Neurolancer-logo/vector/default-monochrome-white.svg" alt="Neurolancer" style="height: 40px;">
        </div>
        <div style="flex: 2; text-align: right;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">{{NEWSLETTER_TITLE}}</h1>
            <p style="color: #e2e8f0; margin: 5px 0 0 0; font-size: 14px;">{{DATE}}</p>
        </div>
    </div>
    
    <!-- Content Card -->
    <div style="background: white; margin: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="padding: 40px 30px;">
            <div style="border-left: 4px solid #667eea; padding-left: 20px; margin-bottom: 30px;">
                <h2 style="color: #1e293b; margin: 0; font-size: 22px;">{{SUBJECT_TITLE}}</h2>
            </div>
            
            <div style="color: #475569; font-size: 16px; line-height: 1.8;">
                {{CONTENT_AREA}}
            </div>
            
            <!-- Feature Box -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 8px; margin: 30px 0; border: 1px solid #e2e8f0;">
                <h3 style="color: #2563eb; margin: 0 0 15px 0; font-size: 18px;">{{FEATURE_TITLE}}</h3>
                <p style="color: #64748b; margin: 0; font-size: 15px;">{{FEATURE_CONTENT}}</p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{{CTA_LINK}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                    {{CTA_TEXT}} →
                </a>
            </div>
        </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 30px 20px; color: #64748b; font-size: 13px;">
        <p style="margin: 0 0 10px 0;">© 2024 Neurolancer. All rights reserved.</p>
        <p style="margin: 0;">
            <a href="{{UNSUBSCRIBE_LINK}}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> | 
            <a href="https://neurolancer-5jxf.vercel.app" style="color: #64748b; text-decoration: underline;">Visit Website</a>
        </p>
    </div>
</body>
</html>''',
            'is_default': False
        },
        {
            'name': 'Modern Announcement',
            'template_type': 'announcement',
            'description': 'Modern template for announcements and updates',
            'html_content': '''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neurolancer Newsletter</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
    <!-- Minimal Header -->
    <div style="background: white; padding: 30px; border-bottom: 3px solid #667eea;">
        <div style="text-align: center;">
            <img src="https://neurolancer-5jxf.vercel.app/assets/Neurolancer-logo/vector/default-monochrome-white.svg" alt="Neurolancer" style="height: 45px; filter: invert(1) sepia(1) saturate(5) hue-rotate(175deg) brightness(0.8);">
        </div>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #1e293b; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: -0.5px;">{{SUBJECT_TITLE}}</h1>
            <div style="width: 60px; height: 3px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 20px auto;"></div>
        </div>
        
        <div style="color: #374151; font-size: 17px; line-height: 1.8; text-align: left;">
            {{CONTENT_AREA}}
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="{{CTA_LINK}}" style="background: #1e293b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 500; font-size: 16px; letter-spacing: 0.5px; text-transform: uppercase;">
                {{CTA_TEXT}}
            </a>
        </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
        <div style="color: #6b7280; font-size: 14px;">
            <p style="margin: 0 0 15px 0;">Neurolancer - Connecting AI Talent with Opportunities</p>
            <p style="margin: 0;">
                <a href="{{UNSUBSCRIBE_LINK}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> | 
                <a href="https://neurolancer-5jxf.vercel.app" style="color: #6b7280; text-decoration: underline;">neurolancer.com</a>
            </p>
        </div>
    </div>
</body>
</html>''',
            'is_default': False
        },
        {
            'name': 'Promotional Campaign',
            'template_type': 'promotional',
            'description': 'Eye-catching template for promotional campaigns',
            'html_content': '''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neurolancer Newsletter</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
    <!-- Modern Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">
        <img src="https://neurolancer-5jxf.vercel.app/assets/Neurolancer-logo/vector/default-monochrome-white.svg" alt="Neurolancer" style="height: 55px; margin-bottom: 20px; position: relative; z-index: 2;">
        <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700; position: relative; z-index: 2;">{{NEWSLETTER_TITLE}}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; position: relative; z-index: 2;">{{SUBTITLE}}</p>
    </div>
    
    <!-- Content with Cards -->
    <div style="padding: 30px 20px;">
        <!-- Main Content Card -->
        <div style="background: white; border-radius: 16px; padding: 35px; margin-bottom: 25px; box-shadow: 0 8px 32px rgba(0,0,0,0.08);">
            <h2 style="color: #1e293b; margin: 0 0 25px 0; font-size: 24px; font-weight: 600;">{{SUBJECT_TITLE}}</h2>
            
            <div style="color: #475569; font-size: 16px; line-height: 1.8;">
                {{CONTENT_AREA}}
            </div>
        </div>
        
        <!-- CTA Card -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #374151 100%); border-radius: 16px; padding: 35px; text-align: center; color: white; margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 600;">{{CTA_TITLE}}</h3>
            <p style="margin: 0 0 25px 0; color: rgba(255,255,255,0.8); font-size: 16px;">{{CTA_DESCRIPTION}}</p>
            <a href="{{CTA_LINK}}" style="background: white; color: #1e293b; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                {{CTA_TEXT}}
            </a>
        </div>
    </div>
    
    <!-- Footer -->
    <div style="background: white; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <div style="color: #64748b; font-size: 14px;">
            <p style="margin: 0 0 15px 0; font-weight: 500;">Stay connected with Neurolancer</p>
            <p style="margin: 15px 0 0 0;">
                <a href="{{UNSUBSCRIBE_LINK}}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> | 
                <a href="https://neurolancer-5jxf.vercel.app" style="color: #64748b; text-decoration: underline;">Visit Neurolancer</a>
            </p>
        </div>
    </div>
</body>
</html>''',
            'is_default': False
        }
    ]
    
    for template_data in templates_data:
        # Create or update template
        template, created = NewsletterTemplate.objects.get_or_create(
            name=template_data['name'],
            defaults={
                'template_type': template_data['template_type'],
                'description': template_data['description'],
                'html_content': template_data['html_content'],
                'is_active': True,
                'is_default': template_data['is_default'],
                'created_by': admin_user
            }
        )

def reverse_populate_newsletter_templates(apps, schema_editor):
    """Remove newsletter templates"""
    NewsletterTemplate = apps.get_model('api', 'NewsletterTemplate')
    template_names = ['Professional Clean', 'Feature Highlight', 'Modern Announcement', 'Promotional Campaign']
    NewsletterTemplate.objects.filter(name__in=template_names).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_assessmentcategory_remove_assessmentattempt_answers_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_newsletter_templates, reverse_populate_newsletter_templates),
    ]