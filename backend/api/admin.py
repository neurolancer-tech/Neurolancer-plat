from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone
from .models import (
    UserProfile, Category, Subcategory, Gig, Order, OrderDeliverable, Review, Team, 
    Conversation, Message, Portfolio, Withdrawal, HelpRequest, GroupJoinRequest,
    Job, Proposal, Notification, UserVerification, SavedSearch, OnboardingResponse,
    Course, Lesson, Enrollment, SkillAssessment, AssessmentQuestion, 
    AssessmentAttempt, SkillBadge, CourseReview, Dispute, ContentReport, AdminAction, SystemSettings,
    NotificationPreference, NotificationTemplate, ErrorLog, UserAnalytics, PlatformAnalytics,
    AnalyticsEvent, ThirdPartyIntegration, IntegrationSync, Project, Task, TaskProposal,
    AssessmentCategory, Assessment, Question, QuestionOption, AssessmentPayment, AssessmentAnswer,
    Transaction, ProfessionalDocument, Like, NewsletterSubscriber, Newsletter, NewsletterSendLog,
    NewsletterTemplate, NewsletterContent, AIConversation, AIMessage
)

# Learning & Development Admin
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'instructor', 'difficulty_level', 'price', 'status', 'enrollment_count', 'rating', 'created_at']
    list_filter = ['status', 'difficulty_level', 'category', 'is_featured', 'created_at']
    search_fields = ['title', 'description', 'instructor__username']
    readonly_fields = ['enrollment_count', 'rating', 'total_reviews', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category', 'instructor')
        }),
        ('Course Details', {
            'fields': ('difficulty_level', 'duration_hours', 'price', 'prerequisites', 'learning_outcomes')
        }),
        ('Media Files', {
            'fields': ('thumbnail', 'preview_video', 'course_file'),
            'description': mark_safe("""
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <h3 style="color: #2c3e50; margin-top: 0;">📚 Course File Upload Instructions</h3>
                
                <h4 style="color: #e74c3c;">🎯 Supported File Types:</h4>
                <ul>
                    <li><strong>ZIP Archives:</strong> .zip (Recommended for multi-file courses)</li>
                    <li><strong>Documents:</strong> .pdf, .docx, .pptx</li>
                    <li><strong>Videos:</strong> .mp4, .avi, .mov, .mkv (Max 500MB)</li>
                    <li><strong>Interactive:</strong> .html, .scorm (for interactive content)</li>
                </ul>
                
                <h4 style="color: #e74c3c;">📁 ZIP File Structure (Recommended):</h4>
                <pre style="background: #2c3e50; color: #ecf0f1; padding: 10px; border-radius: 3px;">
course_name.zip
├── index.html (Course overview/navigation)
├── lessons/
│   ├── lesson_01_introduction.pdf
│   ├── lesson_02_basics.mp4
│   ├── lesson_03_advanced.pdf
│   └── lesson_04_practice.html
├── resources/
│   ├── cheat_sheets/
│   ├── code_examples/
│   ├── datasets/
│   └── additional_reading.pdf
├── assessments/
│   ├── quiz_01.json
│   ├── assignment_01.pdf
│   └── final_project.md
└── course_info.json (Metadata)
                </pre>
                
                <h4 style="color: #e74c3c;">📋 Required Metadata (course_info.json):</h4>
                <pre style="background: #2c3e50; color: #ecf0f1; padding: 10px; border-radius: 3px;">
{
  "course_title": "AI Fundamentals",
  "version": "1.0",
  "lessons": [
    {
      "id": 1,
      "title": "Introduction to AI",
      "type": "video",
      "file": "lessons/lesson_01_intro.mp4",
      "duration_minutes": 45,
      "is_preview": true
    },
    {
      "id": 2,
      "title": "Machine Learning Basics",
      "type": "pdf",
      "file": "lessons/lesson_02_ml.pdf",
      "duration_minutes": 60
    }
  ],
  "assessments": [
    {
      "title": "AI Knowledge Check",
      "file": "assessments/quiz_01.json",
      "passing_score": 70
    }
  ]
}
                </pre>
                
                <h4 style="color: #e74c3c;">🎥 Video Requirements:</h4>
                <ul>
                    <li><strong>Format:</strong> MP4 (H.264 codec recommended)</li>
                    <li><strong>Resolution:</strong> 1080p (1920x1080) or 720p (1280x720)</li>
                    <li><strong>Audio:</strong> AAC codec, 44.1kHz sample rate</li>
                    <li><strong>Bitrate:</strong> 2-5 Mbps for 1080p, 1-3 Mbps for 720p</li>
                    <li><strong>Duration:</strong> 5-60 minutes per video</li>
                </ul>
                
                <h4 style="color: #e74c3c;">📄 Document Guidelines:</h4>
                <ul>
                    <li><strong>PDF:</strong> Searchable text, bookmarks for navigation</li>
                    <li><strong>PowerPoint:</strong> Export as PDF for better compatibility</li>
                    <li><strong>Word:</strong> Use headings and styles for structure</li>
                    <li><strong>Images:</strong> High resolution (300 DPI), compressed for web</li>
                </ul>
                
                <h4 style="color: #e74c3c;">🧪 Interactive Content:</h4>
                <ul>
                    <li><strong>HTML5:</strong> Self-contained with CSS/JS embedded</li>
                    <li><strong>SCORM:</strong> SCORM 1.2 or 2004 compliant packages</li>
                    <li><strong>Jupyter Notebooks:</strong> Export as HTML with outputs</li>
                    <li><strong>Code Examples:</strong> Include README with setup instructions</li>
                </ul>
                
                <h4 style="color: #e74c3c;">✅ Quality Checklist:</h4>
                <ul>
                    <li>✓ All files are virus-free and tested</li>
                    <li>✓ Content is original or properly licensed</li>
                    <li>✓ Videos have clear audio and visuals</li>
                    <li>✓ Documents are well-formatted and readable</li>
                    <li>✓ Interactive elements work across browsers</li>
                    <li>✓ File paths in metadata match actual files</li>
                    <li>✓ Total file size under 1GB (contact admin for larger courses)</li>
                </ul>
                
                <h4 style="color: #27ae60;">💡 Best Practices:</h4>
                <ul>
                    <li><strong>Modular Design:</strong> Break content into digestible chunks</li>
                    <li><strong>Progressive Learning:</strong> Build concepts incrementally</li>
                    <li><strong>Practical Examples:</strong> Include real-world applications</li>
                    <li><strong>Assessments:</strong> Test understanding at key points</li>
                    <li><strong>Resources:</strong> Provide additional learning materials</li>
                </ul>
            </div>
            """)
        }),
        ('Publishing', {
            'fields': ('status', 'is_featured')
        }),
        ('Statistics', {
            'fields': ('enrollment_count', 'rating', 'total_reviews', 'created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category', 'instructor')

class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ['title', 'lesson_type', 'duration_minutes', 'order', 'is_preview']
    ordering = ['order']

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'lesson_type', 'duration_minutes', 'order', 'is_preview']
    list_filter = ['lesson_type', 'is_preview', 'course__category']
    search_fields = ['title', 'course__title', 'description']
    ordering = ['course', 'order']

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'status', 'progress_percentage', 'enrolled_at']
    list_filter = ['status', 'course__category', 'enrolled_at']
    search_fields = ['student__username', 'course__title']
    readonly_fields = ['enrolled_at']

@admin.register(SkillAssessment)
class SkillAssessmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'skill_name', 'category', 'difficulty_level', 'time_limit_minutes', 'passing_score', 'status']
    list_filter = ['status', 'difficulty_level', 'category']
    search_fields = ['title', 'skill_name', 'description']
    inlines = []

class AssessmentQuestionInline(admin.TabularInline):
    model = AssessmentQuestion
    extra = 0
    fields = ['question_text', 'question_type', 'points', 'order']
    ordering = ['order']

@admin.register(AssessmentQuestion)
class AssessmentQuestionAdmin(admin.ModelAdmin):
    list_display = ['assessment', 'question_type', 'points', 'order']
    list_filter = ['question_type', 'assessment__category']
    search_fields = ['question_text', 'assessment__title']

@admin.register(SkillBadge)
class SkillBadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'assessment', 'badge_level', 'score_percentage', 'earned_at', 'is_displayed']
    list_filter = ['badge_level', 'earned_at', 'assessment__category', 'is_displayed']
    search_fields = ['user__username', 'assessment__title']
    readonly_fields = ['earned_at']

@admin.register(CourseReview)
class CourseReviewAdmin(admin.ModelAdmin):
    list_display = ['course', 'student', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['course__title', 'student__username', 'comment']
    readonly_fields = ['created_at']

# Skill Assessment Admin Classes
@admin.register(AssessmentCategory)
class AssessmentCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'difficulty_level', 'duration_minutes', 'price', 'is_active', 'created_at']
    list_filter = ['category', 'difficulty_level', 'is_active', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category', 'difficulty_level')
        }),
        ('Assessment Settings', {
            'fields': ('duration_minutes', 'passing_score', 'price', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )

class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 2
    fields = ['option_text', 'is_correct', 'order']
    ordering = ['order']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['assessment', 'question_type', 'points', 'order', 'is_required']
    list_filter = ['question_type', 'is_required', 'assessment__category']
    search_fields = ['question_text', 'assessment__title']
    inlines = [QuestionOptionInline]
    ordering = ['assessment', 'order']
    
    fieldsets = (
        ('Question Details', {
            'fields': ('assessment', 'question_text', 'question_type', 'points', 'order', 'is_required')
        }),
        ('Answer & Explanation', {
            'fields': ('explanation',)
        })
    )

@admin.register(AssessmentPayment)
class AssessmentPaymentAdmin(admin.ModelAdmin):
    list_display = ['user', 'assessment', 'amount', 'status', 'payment_reference', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'assessment__title', 'payment_reference']
    readonly_fields = ['created_at', 'paid_at']

# AssessmentAttempt admin already registered above

@admin.register(AssessmentAnswer)
class AssessmentAnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question', 'is_correct', 'points_earned', 'answered_at']
    list_filter = ['is_correct', 'question__question_type', 'answered_at']
    search_fields = ['attempt__user__username', 'question__question_text']
    readonly_fields = ['answered_at']

# Existing model registrations
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'user_type', 'rating', 'total_earnings', 'created_at']
    list_filter = ['user_type', 'created_at']
    search_fields = ['user__username', 'user__email']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name', 'description']

@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'description', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'description', 'category__name']

@admin.register(Gig)
class GigAdmin(admin.ModelAdmin):
    list_display = ['title', 'freelancer', 'category', 'basic_price', 'is_active', 'total_orders']
    list_filter = ['is_active', 'category', 'created_at']
    search_fields = ['title', 'freelancer__username']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'client', 'freelancer', 'status', 'price', 'created_at']
    list_filter = ['status', 'created_at', 'is_paid']
    search_fields = ['title', 'client__username', 'freelancer__username']

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'category', 'budget_min', 'budget_max', 'status', 'created_at']
    list_filter = ['status', 'job_type', 'experience_level', 'category']
    search_fields = ['title', 'client__username', 'description']

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ['job', 'freelancer', 'proposed_price', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['job__title', 'freelancer__username', 'cover_letter']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'status', 'total_budget', 'deadline', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['title', 'client__username', 'description']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'assigned_freelancer', 'status', 'budget', 'deadline']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'project__title', 'assigned_freelancer__username']
    readonly_fields = ['created_at', 'updated_at', 'assigned_at', 'completed_at']

@admin.register(TaskProposal)
class TaskProposalAdmin(admin.ModelAdmin):
    list_display = ['task', 'freelancer', 'proposed_budget', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['task__title', 'freelancer__username']
    readonly_fields = ['created_at', 'responded_at']

# Admin & Moderation Admin Classes
@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'complainant', 'respondent', 'category', 'status', 'assigned_admin', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['title', 'complainant__username', 'respondent__username', 'description']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Dispute Information', {
            'fields': ('order', 'complainant', 'respondent', 'category', 'title', 'description')
        }),
        ('Evidence & Documentation', {
            'fields': ('evidence',)
        }),
        ('Admin Management', {
            'fields': ('status', 'assigned_admin', 'admin_notes', 'resolution', 'resolved_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ['collapse']
        })
    )
    
    def save_model(self, request, obj, form, change):
        if change and obj.status == 'resolved' and not obj.resolved_at:
            obj.resolved_at = timezone.now()
        super().save_model(request, obj, form, change)

@admin.register(ContentReport)
class ContentReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'reporter', 'report_type', 'content_type', 'status', 'reviewed_by', 'created_at']
    list_filter = ['status', 'report_type', 'created_at']
    search_fields = ['reporter__username', 'reason', 'content_type']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Report Information', {
            'fields': ('reporter', 'report_type', 'content_type', 'content_id', 'reason')
        }),
        ('Evidence', {
            'fields': ('evidence',)
        }),
        ('Admin Review', {
            'fields': ('status', 'reviewed_by', 'admin_notes', 'action_taken', 'reviewed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ['collapse']
        })
    )

@admin.register(AdminAction)
class AdminActionAdmin(admin.ModelAdmin):
    list_display = ['id', 'admin', 'action_type', 'target_user', 'created_at']
    list_filter = ['action_type', 'created_at']
    search_fields = ['admin__username', 'target_user__username', 'description']
    readonly_fields = ['created_at']

@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'description', 'updated_by', 'updated_at']
    search_fields = ['key', 'description']
    readonly_fields = ['updated_at']
    
    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)



@admin.register(OrderDeliverable)
class OrderDeliverableAdmin(admin.ModelAdmin):
    list_display = ['order', 'status', 'uploaded_at', 'reviewed_at']
    list_filter = ['status', 'uploaded_at']
    search_fields = ['order__title', 'description']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['order', 'reviewer', 'reviewee', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['reviewer__username', 'reviewee__username', 'comment']

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'created_at']
    search_fields = ['name', 'owner__username']
    filter_horizontal = ['members']

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['name', 'conversation_type', 'admin', 'created_at']
    list_filter = ['conversation_type', 'group_type', 'created_at']
    search_fields = ['name', 'admin__username']
    filter_horizontal = ['participants']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'sender', 'content_preview', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['sender__username', 'content']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'

@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ['freelancer', 'title', 'created_at']
    search_fields = ['freelancer__username', 'title']

@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'status', 'created_at', 'processed_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'reference']

@admin.register(HelpRequest)
class HelpRequestAdmin(admin.ModelAdmin):
    list_display = ['requester', 'helper', 'title', 'status', 'payment_share', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['requester__username', 'helper__username', 'title']

@admin.register(GroupJoinRequest)
class GroupJoinRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'group', 'status', 'created_at', 'processed_by']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'group__name']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['user__username', 'title', 'message']

@admin.register(UserVerification)
class UserVerificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'verification_type', 'status', 'verified_at', 'created_at']
    list_filter = ['verification_type', 'status', 'created_at']
    search_fields = ['user__username']

@admin.register(SavedSearch)
class SavedSearchAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'search_type', 'is_active', 'email_notifications', 'created_at']
    list_filter = ['search_type', 'is_active', 'email_notifications', 'created_at']
    search_fields = ['user__username', 'name']

@admin.register(OnboardingResponse)
class OnboardingResponseAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_completed', 'company_name', 'industry', 'created_at']
    list_filter = ['is_completed', 'created_at']
    search_fields = ['user__username', 'company_name', 'industry']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'transaction_type', 'amount', 'status', 'reference', 'created_at']
    list_filter = ['transaction_type', 'status', 'created_at']
    search_fields = ['user__username', 'reference', 'description']
    readonly_fields = ['created_at']

@admin.register(ProfessionalDocument)
class ProfessionalDocumentAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'document_type', 'is_public', 'uploaded_at']
    list_filter = ['document_type', 'is_public', 'uploaded_at']
    search_fields = ['user__username', 'name']

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'content_type', 'object_id', 'is_like', 'created_at']
    list_filter = ['content_type', 'is_like', 'created_at']
    search_fields = ['user__username']

@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ['email', 'user', 'status', 'source', 'subscribed_at']
    list_filter = ['status', 'source', 'user_type_preference', 'subscribed_at']
    search_fields = ['email', 'first_name', 'last_name', 'user__username']

@admin.register(Newsletter)
class NewsletterAdmin(admin.ModelAdmin):
    list_display = ['title', 'newsletter_type', 'status', 'total_recipients', 'open_rate', 'created_at']
    list_filter = ['newsletter_type', 'status', 'target_audience', 'created_at']
    search_fields = ['title', 'subject']
    readonly_fields = ['total_sent', 'total_delivered', 'total_opened', 'total_clicked']

@admin.register(NewsletterSendLog)
class NewsletterSendLogAdmin(admin.ModelAdmin):
    list_display = ['newsletter', 'subscriber', 'status', 'sent_at', 'opened_at']
    list_filter = ['status', 'sent_at']
    search_fields = ['newsletter__title', 'subscriber__email']

@admin.register(NewsletterTemplate)
class NewsletterTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'is_active', 'is_default', 'created_at']
    list_filter = ['template_type', 'is_active', 'is_default']
    search_fields = ['name', 'description']

@admin.register(NewsletterContent)
class NewsletterContentAdmin(admin.ModelAdmin):
    list_display = ['title', 'content_type', 'is_featured', 'is_published', 'author', 'created_at']
    list_filter = ['content_type', 'is_featured', 'is_published', 'created_at']
    search_fields = ['title', 'summary', 'author__username']

@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'updated_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'role', 'content_preview', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['conversation__user__username', 'content']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'

@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'delivery_method', 'frequency', 'is_enabled']
    list_filter = ['category', 'delivery_method', 'frequency', 'is_enabled']
    search_fields = ['user__username', 'user__email']
    
@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['template_type', 'title_template', 'is_active', 'updated_at']
    list_filter = ['template_type', 'is_active']
    search_fields = ['template_type', 'title_template']
    
    fieldsets = (
        ('Template Information', {
            'fields': ('template_type', 'is_active')
        }),
        ('In-App Notification', {
            'fields': ('title_template', 'message_template')
        }),
        ('Email Notification', {
            'fields': ('email_subject', 'email_template')
        })
    )

# Error Handling Admin
@admin.register(ErrorLog)
class ErrorLogAdmin(admin.ModelAdmin):
    list_display = ['error_type', 'message_preview', 'user', 'url', 'resolved', 'created_at']
    list_filter = ['error_type', 'resolved', 'created_at']
    search_fields = ['message', 'url', 'user__username']
    readonly_fields = ['created_at']
    
    def message_preview(self, obj):
        return obj.message[:100] + '...' if len(obj.message) > 100 else obj.message
    message_preview.short_description = 'Message Preview'

# Analytics Admin
@admin.register(UserAnalytics)
class UserAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_orders', 'total_earnings', 'avg_rating', 'last_updated']
    list_filter = ['last_updated']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['last_updated']

@admin.register(PlatformAnalytics)
class PlatformAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_users', 'new_users', 'total_orders', 'total_revenue']
    list_filter = ['date']
    ordering = ['-date']

@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'user', 'timestamp', 'session_id']
    list_filter = ['event_type', 'timestamp']
    search_fields = ['user__username', 'session_id']
    readonly_fields = ['timestamp']

# Integration Admin
@admin.register(ThirdPartyIntegration)
class ThirdPartyIntegrationAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider', 'is_active', 'sync_enabled', 'last_sync', 'created_at']
    list_filter = ['provider', 'is_active', 'sync_enabled', 'created_at']
    search_fields = ['user__username', 'provider_user_id']
    readonly_fields = ['created_at']

@admin.register(IntegrationSync)
class IntegrationSyncAdmin(admin.ModelAdmin):
    list_display = ['integration', 'sync_type', 'status', 'started_at', 'completed_at']
    list_filter = ['sync_type', 'status', 'started_at']
    search_fields = ['integration__user__username', 'integration__provider']
    readonly_fields = ['started_at', 'completed_at']

# Custom User Admin with staff/superuser actions
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

class CustomUserAdmin(UserAdmin):
    actions = ['make_staff', 'make_superuser', 'remove_staff', 'remove_superuser']
    
    def make_staff(self, request, queryset):
        queryset.update(is_staff=True)
        self.message_user(request, f"{queryset.count()} users made staff.")
    make_staff.short_description = "Make selected users staff"
    
    def make_superuser(self, request, queryset):
        queryset.update(is_staff=True, is_superuser=True)
        self.message_user(request, f"{queryset.count()} users made superuser.")
    make_superuser.short_description = "Make selected users superuser"
    
    def remove_staff(self, request, queryset):
        queryset.update(is_staff=False)
        self.message_user(request, f"{queryset.count()} users removed from staff.")
    remove_staff.short_description = "Remove staff status from selected users"
    
    def remove_superuser(self, request, queryset):
        queryset.update(is_superuser=False)
        self.message_user(request, f"{queryset.count()} users removed from superuser.")
    remove_superuser.short_description = "Remove superuser status from selected users"

# Unregister default User admin and register custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# Customize admin site
admin.site.site_header = 'Neurolancer Admin Panel'
admin.site.site_title = 'Neurolancer Admin'
admin.site.index_title = 'Welcome to Neurolancer Administration'
