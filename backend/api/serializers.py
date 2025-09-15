from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import (
    UserProfile, ProfessionalDocument, Category, Subcategory, Gig, Order, OrderDeliverable, Project, Task, TaskProposal,
    Review, Message, Portfolio, Withdrawal, HelpRequest, Conversation, Team, GroupJoinRequest,
    Job, Proposal, Notification, UserVerification, SavedSearch, OnboardingResponse,
    Course, Lesson, Enrollment, SkillAssessment, AssessmentQuestion, AssessmentAttempt, SkillBadge, CourseReview,
    Dispute, ContentReport, AdminAction, SystemSettings, NotificationPreference, NotificationTemplate, ErrorLog,
    UserAnalytics, PlatformAnalytics, AnalyticsEvent, ThirdPartyIntegration, IntegrationSync,
    AIConversation, AIMessage, AssessmentCategory, Assessment, Question, QuestionOption, AssessmentPayment, AssessmentAnswer
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']

class ProfessionalDocumentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    
    class Meta:
        model = ProfessionalDocument
        fields = '__all__'
        read_only_fields = ['user']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_file_size(self, obj):
        if obj.file:
            try:
                return obj.file.size
            except:
                return 0
        return 0
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    professional_documents = ProfessionalDocumentSerializer(many=True, read_only=True, source='user.professional_documents')
    available_balance_kes = serializers.SerializerMethodField()
    total_earnings_kes = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'user_type', 'bio', 'profile_picture', 'avatar_type', 'selected_avatar', 'google_photo_url', 'avatar_url', 
            'skills', 'hourly_rate', 'gender', 'phone', 'address', 'city', 'country', 'website', 'linkedin', 'github',
            'title', 'experience_years', 'education', 'certifications', 'languages', 'professional_documents',
            'total_earnings', 'available_balance', 'available_balance_kes', 'total_earnings_kes', 'completed_gigs', 'rating', 'total_reviews', 
            'likes_count', 'dislikes_count', 'created_at', 'updated_at'
        ]
    
    def get_avatar_url(self, obj):
        return obj.get_avatar_url()
    
    def get_available_balance_kes(self, obj):
        """Convert USD balance to KES for withdrawal display"""
        from decimal import Decimal
        USD_TO_KES_RATE = Decimal('130.0')
        return float(obj.available_balance * USD_TO_KES_RATE)
    
    def get_total_earnings_kes(self, obj):
        """Convert USD earnings to KES for display"""
        from decimal import Decimal
        USD_TO_KES_RATE = Decimal('130.0')
        return float(obj.total_earnings * USD_TO_KES_RATE)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    user_type = serializers.ChoiceField(choices=UserProfile.USER_TYPES)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'user_type']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        user_type = validated_data.pop('user_type')
        validated_data.pop('password_confirm')
        
        # Get client IP for registration tracking
        request = self.context.get('request')
        registration_ip = None
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                registration_ip = x_forwarded_for.split(',')[0]
            else:
                registration_ip = request.META.get('REMOTE_ADDR')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )
        
        UserProfile.objects.create(
            user=user, 
            user_type=user_type,
            email_verified=False,
            registration_ip=registration_ip
        )
        return user

class ProfileCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'phone_number', 'country_code', 'state', 'city', 'address', 'timezone',
            'skills', 'experience_level', 'hourly_rate', 'availability',
            'bio', 'date_of_birth', 'gender'
        ]
    
    def validate_phone_number(self, value):
        if value:
            # Basic phone number validation
            import re
            phone_pattern = re.compile(r'^\+?1?\d{9,15}$')
            if not phone_pattern.match(value.replace(' ', '').replace('-', '')):
                raise serializers.ValidationError("Invalid phone number format")
        return value
    
    def validate_country_code(self, value):
        valid_countries = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IN', 'NG', 'ZA', 'BR', 'KE']
        if value and value not in valid_countries:
            raise serializers.ValidationError("Invalid country code")
        return value
    
    def update(self, instance, validated_data):
        # Mark profile as completed when updating
        validated_data['profile_completed'] = True
        return super().update(instance, validated_data)

class EnhancedUserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'username',
            'date_joined', 'last_login', 'profile'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def get_profile(self, obj):
        try:
            profile = obj.userprofile
            return {
                'user_type': profile.user_type,
                'phone_number': profile.phone_number,
                'phone_verified': profile.phone_verified,
                'country_code': profile.country_code,
                'state': profile.state,
                'city': profile.city,
                'skills': profile.skills,
                'experience_level': profile.experience_level,
                'hourly_rate': float(profile.hourly_rate) if profile.hourly_rate else None,
                'availability': profile.availability,
                'bio': profile.bio,
                'profile_completed': profile.profile_completed,
                'email_verified': profile.email_verified,
                'google_photo_url': profile.google_photo_url,
                'avatar_url': profile.get_avatar_url(),
            }
        except UserProfile.DoesNotExist:
            return None

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username_or_email = attrs.get('username')
        password = attrs.get('password')
        
        if username_or_email and password:
            user_obj = None
            
            # Try to find user by username first
            try:
                user_obj = User.objects.get(username=username_or_email)
                print(f"UserLoginSerializer: Found user by username {username_or_email}")
            except User.DoesNotExist:
                # If not found by username, try by email
                try:
                    user_obj = User.objects.get(email=username_or_email)
                    print(f"UserLoginSerializer: Found user by email {username_or_email}")
                except User.DoesNotExist:
                    print(f"UserLoginSerializer: User {username_or_email} not found by username or email")
                    raise serializers.ValidationError('Invalid credentials')
            
            if user_obj:
                # Check if user is active
                if not user_obj.is_active:
                    print(f"UserLoginSerializer: User {user_obj.username} is not active")
                    raise serializers.ValidationError('User account is disabled')
                
                # Try authentication with the actual username
                user = authenticate(username=user_obj.username, password=password)
                if not user:
                    print(f"UserLoginSerializer: Authentication failed for {user_obj.username}")
                    # Try direct password check as fallback
                    if user_obj.check_password(password):
                        print(f"UserLoginSerializer: Direct password check succeeded for {user_obj.username}")
                        user = user_obj
                    else:
                        print(f"UserLoginSerializer: Direct password check also failed for {user_obj.username}")
                        raise serializers.ValidationError('Invalid credentials')
                else:
                    print(f"UserLoginSerializer: Authentication succeeded for {user_obj.username}")
                
                attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')
        
        return attrs

class SubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategory
        fields = ['id', 'name', 'description', 'created_at']

class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubcategorySerializer(many=True, read_only=True)
    gigs_count = serializers.SerializerMethodField()
    jobs_count = serializers.SerializerMethodField()
    courses_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = '__all__'
    
    def get_gigs_count(self, obj):
        return obj.gigs.filter(is_active=True).count()
    
    def get_jobs_count(self, obj):
        try:
            # Count all jobs tied to this category
            return obj.jobs.count()
        except Exception:
            return 0
    
    def get_courses_count(self, obj):
        try:
            return obj.courses.count()
        except Exception:
            return 0

class CategoryWithSubcategoriesSerializer(serializers.ModelSerializer):
    subcategories = SubcategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'subcategories', 'created_at']

class GigSerializer(serializers.ModelSerializer):
    freelancer = UserSerializer(read_only=True)
    freelancer_profile = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    image_url = serializers.URLField(required=False, allow_blank=True)
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Gig
        fields = '__all__'
    
    def get_image(self, obj):
        # Return image_url if available, otherwise uploaded image, otherwise default
        if obj.image_url and obj.image_url.strip():
            return obj.image_url
        elif obj.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
            except (ValueError, AttributeError):
                # Handle case where image field exists but file is missing
                return '/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg'
        else:
            return '/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg'
    
    def get_freelancer_profile(self, obj):
        try:
            profile = obj.freelancer.userprofile
            return {
                'rating': float(profile.rating),
                'total_reviews': profile.total_reviews,
                'completed_gigs': profile.completed_gigs,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None
            }
        except UserProfile.DoesNotExist:
            return None
    
    def create(self, validated_data):
        validated_data['freelancer'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Handle image field updates properly
        request = self.context.get('request')
        
        # Check if new image file is being uploaded
        if request and 'image' in request.FILES:
            # Clear image_url when uploading new file
            validated_data['image_url'] = ''
            # Delete old image file if exists
            if instance.image:
                instance.image.delete(save=False)
        
        # Check if image_url is being set
        elif 'image_url' in validated_data and validated_data.get('image_url'):
            # Clear image file when using URL
            if instance.image:
                instance.image.delete(save=False)
                instance.image = None
                instance.save()
        
        # Check if clearing image (using default)
        elif request and request.data.get('clear_image') == 'true':
            if instance.image:
                instance.image.delete(save=False)
            instance.image = None
            instance.image_url = ''
            instance.save()
        
        return super().update(instance, validated_data)

class GigListSerializer(serializers.ModelSerializer):
    freelancer = UserSerializer(read_only=True)
    freelancer_profile = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Gig
        fields = [
            'id', 'title', 'image', 'basic_price', 'rating', 'total_reviews',
            'freelancer', 'freelancer_profile', 'category', 'likes_count', 'dislikes_count', 'created_at'
        ]
    
    def get_image(self, obj):
        # Return image_url if available, otherwise uploaded image, otherwise default
        if obj.image_url and obj.image_url.strip():
            return obj.image_url
        elif obj.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
            except (ValueError, AttributeError):
                # Handle case where image field exists but file is missing
                return '/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg'
        else:
            return '/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg'
    
    def get_freelancer_profile(self, obj):
        try:
            profile = obj.freelancer.userprofile
            return {
                'rating': float(profile.rating),
                'total_reviews': profile.total_reviews,
                'completed_gigs': profile.completed_gigs,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None
            }
        except UserProfile.DoesNotExist:
            return None

class ProjectSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    tasks_count = serializers.SerializerMethodField()
    team_members_count = serializers.SerializerMethodField()
    conversation_id = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = '__all__'
    
    def get_tasks_count(self, obj):
        return obj.tasks.count()
    
    def get_team_members_count(self, obj):
        try:
            from django.db.models import Q
            # Count users who have accepted orders for tasks in this project
            return User.objects.filter(
                Q(assigned_tasks__project=obj) | 
                Q(freelancer_orders__task__project=obj, freelancer_orders__status__in=['accepted', 'in_progress', 'delivered', 'completed'])
            ).distinct().count()
        except Exception as e:
            print(f"Error counting team members for project {obj.id}: {e}")
            return 0
    
    def get_conversation_id(self, obj):
        return obj.conversation.id if obj.conversation else None
    
    def get_progress(self, obj):
        tasks = obj.tasks.all()
        if not tasks.exists():
            return {'percentage': 0, 'completed': 0, 'total': 0}
        
        total = tasks.count()
        completed = tasks.filter(status='completed').count()
        percentage = (completed / total * 100) if total > 0 else 0
        
        # Project cannot be completed if any tasks are not completed
        if completed < total and obj.status == 'completed':
            obj.status = 'active'
            obj.save()
        
        return {
            'percentage': round(percentage, 1),
            'completed': completed,
            'total': total
        }

class ProjectDetailSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    tasks = serializers.SerializerMethodField()
    team_members = serializers.SerializerMethodField()
    conversation_id = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = '__all__'
    
    def get_tasks(self, obj):
        # Use a simple task representation to avoid circular imports
        tasks_data = []
        for task in obj.tasks.all():
            # Get the most recent order for this task
            order = task.orders.filter(task=task).order_by('-created_at').first()
            
            task_data = {
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'status': task.status,
                'priority': task.priority,
                'budget': float(task.budget),
                'progress': task.progress,
                'deadline': task.deadline.isoformat() if task.deadline else None,
                'created_at': task.created_at.isoformat(),
                'assigned_freelancer': UserSerializer(task.assigned_freelancer).data if task.assigned_freelancer else None
            }
            
            # Add order information for payment tracking
            if order:
                task_data['order'] = {
                    'id': order.id,
                    'status': order.status
                }
                # If task doesn't have assigned_freelancer but order exists, use order's freelancer
                if not task.assigned_freelancer and order.freelancer:
                    task_data['assigned_freelancer'] = UserSerializer(order.freelancer).data
            
            tasks_data.append(task_data)
        return tasks_data
    
    def get_team_members(self, obj):
        try:
            from django.db.models import Q
            # Get users who have accepted orders for tasks in this project
            team_members = User.objects.filter(
                Q(assigned_tasks__project=obj) | 
                Q(freelancer_orders__task__project=obj, freelancer_orders__status__in=['accepted', 'in_progress', 'delivered', 'completed'])
            ).distinct()
            return UserSerializer(team_members, many=True).data
        except Exception as e:
            print(f"Error getting team members for project {obj.id}: {e}")
            return []
    
    def get_conversation_id(self, obj):
        return obj.conversation.id if obj.conversation else None
    
    def get_progress(self, obj):
        tasks = obj.tasks.all()
        if not tasks.exists():
            return {'percentage': 0, 'completed': 0, 'total': 0}
        
        total = tasks.count()
        completed = tasks.filter(status='completed').count()
        percentage = (completed / total * 100) if total > 0 else 0
        
        return {
            'percentage': round(percentage, 1),
            'completed': completed,
            'total': total
        }

class TaskSerializer(serializers.ModelSerializer):
    assigned_freelancer = UserSerializer(read_only=True)
    project_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'budget', 'deadline', 'priority', 
            'status', 'requirements', 'skills_required', 'progress', 
            'created_at', 'updated_at', 'assigned_at', 'completed_at',
            'assigned_freelancer', 'project_id'
        ]
        read_only_fields = ['id', 'status', 'progress', 'created_at', 'updated_at', 'assigned_at', 'completed_at']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add project data without circular import
        if instance.project:
            data['project'] = {
                'id': instance.project.id,
                'title': instance.project.title,
                'status': instance.project.status
            }
        # Add order data for payment tracking
        try:
            order = instance.orders.filter(task=instance).first()
            if order:
                order_data = {
                    'id': order.id,
                    'status': order.status,
                    'has_review': hasattr(order, 'review') and order.review is not None
                }
                # Include gig information if available
                if order.gig:
                    order_data['gig'] = {
                        'id': order.gig.id,
                        'title': order.gig.title
                    }
                data['order'] = order_data
        except:
            pass
        return data

class TaskProposalSerializer(serializers.ModelSerializer):
    task = TaskSerializer(read_only=True)
    freelancer = UserSerializer(read_only=True)
    task_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = TaskProposal
        fields = '__all__'
        read_only_fields = ['freelancer', 'responded_at']

class OrderSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    freelancer = UserSerializer(read_only=True)
    gig = GigListSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    task = TaskSerializer(read_only=True)
    gig_id = serializers.IntegerField(write_only=True)
    task_id = serializers.IntegerField(write_only=True, required=False)
    project_title = serializers.CharField(write_only=True, required=False)
    has_review = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['payment_id', 'is_paid', 'escrow_released', 'total_amount', 'freelancer', 'gig', 'project', 'task']
        extra_kwargs = {
            'title': {'required': False},
            'description': {'required': False}, 
            'price': {'required': False},
            'delivery_time': {'required': False}
        }
    
    def get_has_review(self, obj):
        """Check if this order has been reviewed"""
        try:
            return hasattr(obj, 'review') and obj.review is not None
        except:
            return False
    
    def create(self, validated_data):
        from django.utils import timezone
        from decimal import Decimal
        
        validated_data['client'] = self.context['request'].user
        gig = Gig.objects.get(id=validated_data['gig_id'])
        validated_data['freelancer'] = gig.freelancer
        
        # Set package details based on package_type
        package_type = validated_data.get('package_type', 'basic')
        if package_type == 'basic':
            validated_data['title'] = gig.title
            validated_data['description'] = gig.basic_description or gig.description
            validated_data['price'] = gig.basic_price
            validated_data['delivery_time'] = gig.basic_delivery_time or 7
        elif package_type == 'standard':
            validated_data['title'] = gig.title
            validated_data['description'] = gig.standard_description or gig.basic_description or gig.description
            validated_data['price'] = gig.standard_price or gig.basic_price
            validated_data['delivery_time'] = gig.standard_delivery_time or gig.basic_delivery_time or 7
        elif package_type == 'premium':
            validated_data['title'] = gig.title
            validated_data['description'] = gig.premium_description or gig.standard_description or gig.basic_description or gig.description
            validated_data['price'] = gig.premium_price or gig.standard_price or gig.basic_price
            validated_data['delivery_time'] = gig.premium_delivery_time or gig.standard_delivery_time or gig.basic_delivery_time or 7
        
        # Calculate total amount including service fee
        service_fee = validated_data['price'] * Decimal('0.10')
        validated_data['total_amount'] = validated_data['price'] + service_fee
        
        # Set gig reference and initial status
        validated_data['gig'] = gig
        validated_data['status'] = 'pending'  # Order requires freelancer acceptance
        
        # Link to task if provided
        task_id = validated_data.get('task_id')
        if task_id:
            try:
                from .models import Task
                task = Task.objects.get(id=task_id, project__client=validated_data['client'])
                validated_data['task'] = task
                validated_data['project'] = task.project
            except Task.DoesNotExist:
                pass  # Task not found or not owned by client
        
        order = super().create(validated_data)
        
        # Update task assignment if linked
        if hasattr(order, 'task') and order.task:
            order.task.assigned_freelancer = order.freelancer
            order.task.status = 'assigned'
            order.task.assigned_at = timezone.now()
            order.task.save()
        
        # Send notification to freelancer about new order
        try:
            from .notification_service import NotificationService
            NotificationService.create_notification(
                user=order.freelancer,
                title=f"New Order Request: {order.title}",
                message=f"You received a new order request from {order.client.get_full_name() or order.client.username}. Please review and accept to start working.",
                notification_type='order',
                action_url=f'/freelancer-orders.html',
                related_object_id=order.id
            )
        except Exception as e:
            # Fallback notification creation
            from .models import Notification
            Notification.objects.create(
                user=order.freelancer,
                title=f"New Order Request: {order.title}",
                message=f"You received a new order request from {order.client.get_full_name() or order.client.username}. Please review and accept to start working.",
                notification_type='order',
                action_url=f'/orders',
                related_object_id=order.id
            )
        
        return order

class OrderDeliverableSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDeliverable
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    reviewee = UserSerializer(read_only=True)
    gig = GigListSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['reviewer', 'reviewee', 'gig']
    
    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        order = validated_data['order']
        
        # Ensure the order has a gig (required field)
        if not order.gig:
            raise serializers.ValidationError("Cannot create review: Order must have an associated gig")
        
        # Set the gig from the order
        validated_data['gig'] = order.gig
        
        # Determine reviewee based on who is reviewing
        if order.client == self.context['request'].user:
            validated_data['reviewee'] = order.freelancer
        else:
            validated_data['reviewee'] = order.client
        
        # Create the review
        review = super().create(validated_data)
        
        # Update gig rating
        from django.db.models import Avg
        reviews = Review.objects.filter(gig=order.gig)
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        order.gig.rating = avg_rating
        order.gig.total_reviews = reviews.count()
        order.gig.save()
        
        # Update freelancer profile rating
        freelancer_reviews = Review.objects.filter(reviewee=order.freelancer)
        freelancer_avg = freelancer_reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        freelancer_profile = order.freelancer.userprofile
        freelancer_profile.rating = freelancer_avg
        freelancer_profile.total_reviews = freelancer_reviews.count()
        freelancer_profile.save()
        
        return review

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    password = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = '__all__'
    
    def get_password(self, obj):
        request_user = self.context['request'].user
        # Return password for all members of private groups
        if obj.conversation_type == 'group' and obj.group_type == 'private' and request_user in obj.participants.all():
            return obj.password
        return None
    
    def get_other_participant(self, obj):
        request_user = self.context['request'].user
        other = obj.get_other_participant(request_user)
        return UserSerializer(other).data if other else None
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        return MessageSerializer(last_msg).data if last_msg else None
    
    def get_unread_count(self, obj):
        request_user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=request_user).count()
    
    def get_is_admin(self, obj):
        request_user = self.context['request'].user
        return obj.is_admin(request_user)
    
    def get_member_count(self, obj):
        return obj.participants.count()
    
    def get_can_edit(self, obj):
        request_user = self.context['request'].user
        return obj.is_admin(request_user)

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    attachment_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()
    attachment_type = serializers.SerializerMethodField()
    attachment_size = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['sender', 'attachment_url', 'attachment_name', 'attachment_type', 'attachment_size']
    
    def get_attachment_url(self, obj):
        # Return stored attachment_url if available, otherwise generate from file
        if obj.attachment_url:
            return obj.attachment_url
        elif obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None
    
    def get_attachment_name(self, obj):
        # Return stored attachment_name if available, otherwise extract from file
        if obj.attachment_name:
            return obj.attachment_name
        elif obj.attachment:
            return obj.attachment.name.split('/')[-1]
        return None
    
    def get_attachment_type(self, obj):
        # Return stored attachment_type if available, otherwise determine from file
        if obj.attachment_type:
            return obj.attachment_type
        elif obj.attachment:
            name = obj.attachment.name.lower()
            if name.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                return 'image'
            elif name.endswith(('.mp3', '.wav', '.ogg', '.m4a')):
                return 'audio'
            elif name.endswith(('.mp4', '.avi', '.mov', '.wmv')):
                return 'video'
            elif name.endswith(('.pdf', '.doc', '.docx', '.txt', '.rtf')):
                return 'document'
            else:
                return 'file'
        return None
    
    def get_attachment_size(self, obj):
        # Return stored attachment_size if available, otherwise get from file
        if obj.attachment_size:
            return obj.attachment_size
        elif obj.attachment:
            try:
                return obj.attachment.size
            except:
                return 0
        return 0
    
    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        
        message = super().create(validated_data)
        
        # Auto-populate attachment metadata if file is uploaded
        if message.attachment:
            message.attachment_name = message.attachment.name.split('/')[-1]
            message.attachment_size = message.attachment.size
            
            # Generate attachment URL
            request = self.context.get('request')
            if request:
                message.attachment_url = request.build_absolute_uri(message.attachment.url)
            else:
                message.attachment_url = message.attachment.url
            
            # Determine file type
            name = message.attachment.name.lower()
            if name.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                message.attachment_type = 'image'
            elif name.endswith(('.mp3', '.wav', '.ogg', '.m4a')):
                message.attachment_type = 'audio'
            elif name.endswith(('.mp4', '.avi', '.mov', '.wmv')):
                message.attachment_type = 'video'
            elif name.endswith(('.pdf', '.doc', '.docx', '.txt', '.rtf')):
                message.attachment_type = 'document'
            else:
                message.attachment_type = 'file'
            
            message.save()
        
        return message

class PortfolioSerializer(serializers.ModelSerializer):
    freelancer = UserSerializer(read_only=True)
    
    class Meta:
        model = Portfolio
        fields = '__all__'
    
    def create(self, validated_data):
        validated_data['freelancer'] = self.context['request'].user
        return super().create(validated_data)

class WithdrawalSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Withdrawal
        fields = '__all__'
        read_only_fields = ['user', 'paystack_transfer_code', 'paystack_recipient_code', 'reference', 'status', 'processed_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class TeamSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = '__all__'
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        team = super().create(validated_data)
        team.members.add(self.context['request'].user)
        return team

class HelpRequestSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    helper = UserSerializer(read_only=True)
    order = OrderSerializer(read_only=True)
    order_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = HelpRequest
        fields = '__all__'
        read_only_fields = ['requester', 'helper', 'accepted_at', 'completed_at']
    
    def create(self, validated_data):
        validated_data['requester'] = self.context['request'].user
        return super().create(validated_data)

class GroupJoinRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    group = ConversationSerializer(read_only=True)
    processed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = GroupJoinRequest
        fields = '__all__'
        read_only_fields = ['user', 'status', 'processed_at', 'processed_by']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class GroupCreateSerializer(serializers.ModelSerializer):
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Conversation
        fields = ['name', 'description', 'group_type', 'password', 'max_members', 'is_discoverable', 'user_ids']
    
    def create(self, validated_data):
        user_ids = validated_data.pop('user_ids', [])
        validated_data['conversation_type'] = 'group'
        validated_data['admin'] = self.context['request'].user
        
        conversation = super().create(validated_data)
        conversation.participants.add(self.context['request'].user)
        
        # Add selected users
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                conversation.participants.add(user)
            except User.DoesNotExist:
                pass
        
        return conversation

# Jobs/Projects Marketplace Serializers
class JobSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)
    skills_list = serializers.SerializerMethodField()
    time_until_deadline = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = '__all__'
    
    def get_skills_list(self, obj):
        if obj.skills_required:
            return [skill.strip() for skill in obj.skills_required.split(',') if skill.strip()]
        return []
    
    def get_time_until_deadline(self, obj):
        from django.utils import timezone
        now = timezone.now()
        if obj.deadline and obj.deadline > now:
            delta = obj.deadline - now
            days = delta.days
            hours = delta.seconds // 3600
            if days > 0:
                return f"{days} days"
            elif hours > 0:
                return f"{hours} hours"
            else:
                return "Less than 1 hour"
        return "Expired" if obj.deadline else "No deadline"
    
    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        
        # Handle category field - accept both 'category' and 'category_id'
        if 'category' in validated_data and 'category_id' not in validated_data:
            validated_data['category_id'] = validated_data.pop('category')
        
        return super().create(validated_data)

class JobListSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    skills_list = serializers.SerializerMethodField()
    time_until_deadline = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'budget_min', 'budget_max', 'experience_level', 
            'job_type', 'proposal_count', 'created_at', 'deadline',
            'client', 'category', 'skills_list', 'time_until_deadline', 'location',
            'likes_count', 'dislikes_count'
        ]
    
    def get_skills_list(self, obj):
        if obj.skills_required:
            return [skill.strip() for skill in obj.skills_required.split(',') if skill.strip()][:3]
        return []
    
    def get_time_until_deadline(self, obj):
        from django.utils import timezone
        now = timezone.now()
        if obj.deadline and obj.deadline > now:
            delta = obj.deadline - now
            days = delta.days
            if days > 0:
                return f"{days} days left"
            else:
                hours = delta.seconds // 3600
                return f"{hours} hours left"
        return "Expired" if obj.deadline else "No deadline"

class ProposalSerializer(serializers.ModelSerializer):
    freelancer = UserSerializer(read_only=True)
    freelancer_profile = serializers.SerializerMethodField()
    job = JobSerializer(read_only=True)
    job_id = serializers.IntegerField(write_only=True)
    attachment_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Proposal
        fields = ['id', 'job', 'job_id', 'freelancer', 'freelancer_profile', 'cover_letter', 'proposed_price', 'delivery_time', 'questions', 'attachments', 'attachment_url', 'status', 'created_at', 'updated_at']
    
    def get_freelancer_profile(self, obj):
        try:
            profile = obj.freelancer.userprofile
            return {
                'rating': float(profile.rating),
                'total_reviews': profile.total_reviews,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                'skills': profile.skills
            }
        except UserProfile.DoesNotExist:
            return None
    
    def get_attachment_url(self, obj):
        if obj.attachments:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachments.url)
            return obj.attachments.url
        return None
    
    def create(self, validated_data):
        validated_data['freelancer'] = self.context['request'].user
        
        # Get job_id and set job reference
        job_id = validated_data.pop('job_id', None)
        if job_id:
            try:
                job = Job.objects.get(id=job_id)
                validated_data['job'] = job
            except Job.DoesNotExist:
                raise serializers.ValidationError({'job_id': 'Job not found'})
        else:
            raise serializers.ValidationError({'job_id': 'Job ID is required'})
        
        proposal = super().create(validated_data)
        
        # Update job proposal count after successful creation
        job.proposal_count += 1
        job.save()
        
        # Notify client
        try:
            from .models import Notification
            Notification.objects.create(
                user=job.client,
                title=f"New Proposal: {job.title}",
                message=f"You received a new proposal from {self.context['request'].user.first_name or self.context['request'].user.username}",
                notification_type='proposal',
                action_url=f'/my-jobs',
                related_object_id=proposal.id
            )
        except Exception:
            pass  # Don't fail proposal creation if notification fails
        
        return proposal

class ProposalListSerializer(serializers.ModelSerializer):
    freelancer = UserSerializer(read_only=True)
    freelancer_profile = serializers.SerializerMethodField()
    job = JobSerializer(read_only=True)
    
    class Meta:
        model = Proposal
        fields = [
            'id', 'proposed_price', 'delivery_time', 'status', 'created_at',
            'freelancer', 'freelancer_profile', 'job', 'cover_letter'
        ]
    
    def get_freelancer_profile(self, obj):
        try:
            profile = obj.freelancer.userprofile
            return {
                'rating': float(profile.rating),
                'total_reviews': profile.total_reviews,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None
            }
        except UserProfile.DoesNotExist:
            return None

# Notification System Serializers
class NotificationSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True, required=False)
    action_url = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user']
    
    def validate_action_url(self, value):
        """Validate and clean action_url field"""
        if isinstance(value, list):
            # If it's a list, take the first element
            value = value[0] if len(value) > 0 else ''
        
        # Convert to string if not already
        value = str(value) if value is not None else ''
        
        # Basic URL validation (optional)
        if value and not (value.startswith('/') or value.startswith('http')):
            value = f'/{value}'
        
        return value
    
    def create(self, validated_data):
        # Handle user_id parameter for creating notifications for other users
        user_id = validated_data.pop('user_id', None)
        print(f"NotificationSerializer: user_id from validated_data = {user_id}")
        print(f"NotificationSerializer: validated_data = {validated_data}")
        
        if user_id:
            try:
                target_user = User.objects.get(id=user_id)
                validated_data['user'] = target_user
                print(f"NotificationSerializer: Set user to {target_user.username}")
            except User.DoesNotExist:
                print(f"NotificationSerializer: User {user_id} not found")
                raise serializers.ValidationError({'user_id': 'User not found'})
        else:
            # Default to requesting user if no user_id provided
            validated_data['user'] = self.context['request'].user
            print(f"NotificationSerializer: Using request user {self.context['request'].user.username}")
        
        print(f"NotificationSerializer: Final validated_data = {validated_data}")
        return super().create(validated_data)

# Enhanced User Serializers
class UserVerificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserVerification
        fields = ['id', 'user', 'verification_type', 'status', 'notes', 'verified_at', 'created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class SavedSearchSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = SavedSearch
        fields = ['id', 'user', 'name', 'search_type', 'query_params', 'is_active', 'email_notifications', 'created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class OnboardingResponseSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    interested_subcategories = SubcategorySerializer(many=True, read_only=True)
    interested_subcategory_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = OnboardingResponse
        fields = ['id', 'user', 'is_completed', 'company_name', 'company_size', 'industry', 'project_types', 'budget_range', 'timeline_preference', 'goals', 'hear_about_us', 'specialization', 'experience_years', 'education_level', 'work_preference', 'availability', 'rate_expectation', 'interested_subcategories', 'interested_subcategory_ids', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        
        # Extract subcategory IDs
        subcategory_ids = validated_data.pop('interested_subcategory_ids', [])
        
        # Use get_or_create to handle existing records
        instance, created = OnboardingResponse.objects.get_or_create(
            user=user,
            defaults=validated_data
        )
        
        # If record exists, update it with new data
        if not created:
            for key, value in validated_data.items():
                setattr(instance, key, value)
            instance.save()
        
        # Set subcategories
        if subcategory_ids:
            instance.interested_subcategories.set(subcategory_ids)
        
        return instance

# Learning & Development Serializers
class CourseSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    lessons_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    course_file = serializers.FileField(required=False)
    thumbnail_url = serializers.URLField(required=False)
    thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = '__all__'
    
    def get_thumbnail(self, obj):
        # Return thumbnail_url if available, otherwise uploaded thumbnail, otherwise default
        if obj.thumbnail_url:
            return obj.thumbnail_url
        elif obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        else:
            return '/assets/images/learn ai default.png'
    
    def get_lessons_count(self, obj):
        return obj.lessons.count()
    
    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(student=request.user).exists()
        return False
    
    def get_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            enrollment = obj.enrollments.filter(student=request.user).first()
            return float(enrollment.progress_percentage) if enrollment else 0.0
        return 0.0
    
    def create(self, validated_data):
        # Set a default course_file if not provided
        if 'course_file' not in validated_data:
            validated_data['course_file'] = None
        return super().create(validated_data)

class CourseListSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    lessons_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'difficulty_level', 'duration_hours', 
            'price', 'thumbnail', 'rating', 'enrollment_count', 'instructor', 
            'category', 'lessons_count', 'is_enrolled', 'created_at'
        ]
    
    def get_thumbnail(self, obj):
        # Return thumbnail_url if available, otherwise uploaded thumbnail, otherwise default
        if obj.thumbnail_url:
            return obj.thumbnail_url
        elif obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        else:
            return '/assets/images/learn ai default.png'
    
    def get_lessons_count(self, obj):
        return obj.lessons.count()
    
    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(student=request.user).exists()
        return False

class LessonSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = '__all__'
    
    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            enrollment = obj.course.enrollments.filter(student=request.user).first()
            if enrollment:
                return obj in enrollment.completed_lessons.all()
        return False

class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    course_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ['student', 'progress_percentage', 'completed_lessons']
    
    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        
        # Update course enrollment count
        course = Course.objects.get(id=validated_data['course_id'])
        course.enrollment_count += 1
        course.save()
        
        return super().create(validated_data)

class SkillAssessmentSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    questions_count = serializers.SerializerMethodField()
    user_attempts = serializers.SerializerMethodField()
    best_score = serializers.SerializerMethodField()
    
    class Meta:
        model = SkillAssessment
        fields = '__all__'
    
    def get_questions_count(self, obj):
        return obj.questions.count()
    
    def get_user_attempts(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.attempts.filter(user=request.user).count()
        return 0
    
    def get_best_score(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            best_attempt = obj.attempts.filter(user=request.user, status='completed').order_by('-score').first()
            return float(best_attempt.score) if best_attempt else None
        return None

class AssessmentQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentQuestion
        fields = ['id', 'question_text', 'question_type', 'options', 'points', 'order']
        # Exclude correct_answer and explanation from API response

class AssessmentAttemptSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    assessment = SkillAssessmentSerializer(read_only=True)
    assessment_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = AssessmentAttempt
        fields = '__all__'
        read_only_fields = ['user', 'score', 'passed', 'completed_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class CourseBadgeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    assessment = SkillAssessmentSerializer(read_only=True)
    
    class Meta:
        model = SkillBadge
        fields = '__all__'

class CourseReviewSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = CourseReview
        fields = ['id', 'course', 'student', 'rating', 'comment', 'created_at']
        read_only_fields = ['student', 'course']
    
    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)

# Admin & Moderation Serializers
class DisputeSerializer(serializers.ModelSerializer):
    complainant = UserSerializer(read_only=True)
    respondent = UserSerializer(read_only=True)
    order = OrderSerializer(read_only=True)
    order_id = serializers.IntegerField(write_only=True)
    assigned_admin = UserSerializer(read_only=True)
    
    class Meta:
        model = Dispute
        fields = '__all__'
        read_only_fields = ['complainant', 'resolved_at']
    
    def create(self, validated_data):
        validated_data['complainant'] = self.context['request'].user
        order = Order.objects.get(id=validated_data['order_id'])
        
        # Determine respondent based on who is filing the dispute
        if order.client == self.context['request'].user:
            validated_data['respondent'] = order.freelancer
        else:
            validated_data['respondent'] = order.client
        
        validated_data['order'] = order
        return super().create(validated_data)

class ContentReportSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = ContentReport
        fields = '__all__'
        read_only_fields = ['reporter', 'reviewed_by', 'reviewed_at']
    
    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)

class AdminActionSerializer(serializers.ModelSerializer):
    admin = UserSerializer(read_only=True)
    target_user = UserSerializer(read_only=True)
    
    class Meta:
        model = AdminAction
        fields = '__all__'
        read_only_fields = ['admin', 'created_at']
    
    def create(self, validated_data):
        validated_data['admin'] = self.context['request'].user
        return super().create(validated_data)

class SystemSettingsSerializer(serializers.ModelSerializer):
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = SystemSettings
        fields = '__all__'
        read_only_fields = ['updated_by', 'updated_at']
    
    def create(self, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().create(validated_data)

# Admin Dashboard Serializers
class AdminDashboardStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    pending_disputes = serializers.IntegerField()
    pending_reports = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    monthly_revenue = serializers.ListField()
    user_growth = serializers.ListField()
    order_stats = serializers.DictField()
    category_stats = serializers.ListField()

# Notification System Serializers
class NotificationPreferenceSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class NotificationWithPreferencesSerializer(serializers.ModelSerializer):
    """Enhanced notification serializer with user preferences"""
    can_email = serializers.SerializerMethodField()
    can_push = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = '__all__'
    
    def get_can_email(self, obj):
        try:
            pref = NotificationPreference.objects.get(
                user=obj.user,
                category=obj.notification_type,
                delivery_method='email'
            )
            return pref.is_enabled
        except NotificationPreference.DoesNotExist:
            return False
    
    def get_can_push(self, obj):
        try:
            pref = NotificationPreference.objects.get(
                user=obj.user,
                category=obj.notification_type,
                delivery_method='push'
            )
            return pref.is_enabled
        except NotificationPreference.DoesNotExist:
            return False

# Error Handling Serializers
class ErrorLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ErrorLog
        fields = '__all__'
        read_only_fields = ['created_at']

# Analytics Serializers
class UserAnalyticsSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserAnalytics
        fields = '__all__'
        read_only_fields = ['user', 'last_updated']

class PlatformAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformAnalytics
        fields = '__all__'

class AnalyticsEventSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = AnalyticsEvent
        fields = '__all__'
        read_only_fields = ['user', 'timestamp']
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)

# Integration Serializers
class ThirdPartyIntegrationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ThirdPartyIntegration
        fields = ['id', 'provider', 'is_active', 'sync_enabled', 'last_sync', 'created_at']
        read_only_fields = ['user', 'created_at']

class IntegrationSyncSerializer(serializers.ModelSerializer):
    integration_provider = serializers.CharField(source='integration.provider', read_only=True)
    
    class Meta:
        model = IntegrationSync
        fields = '__all__'
        read_only_fields = ['started_at', 'completed_at']

# Admin Serializers
class AdminUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='userprofile', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined', 'last_login', 'profile']

# AI Assistant Serializers
class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ['id', 'role', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']

class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = AIConversation
        fields = ['id', 'user', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

# Skill Assessment System Serializers
class AssessmentCategorySerializer(serializers.ModelSerializer):
    assessments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AssessmentCategory
        fields = '__all__'
    
    def get_assessments_count(self, obj):
        return obj.assessment_set.filter(is_active=True).count()

class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'order']
        # Exclude is_correct from API response for security

class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'points', 'order', 'is_required', 'options']
        # Exclude explanation from API response

class AssessmentSerializer(serializers.ModelSerializer):
    category = AssessmentCategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)
    questions_count = serializers.SerializerMethodField()
    user_attempts = serializers.SerializerMethodField()
    best_score = serializers.SerializerMethodField()
    has_paid = serializers.SerializerMethodField()
    attempts_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Assessment
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_questions_count(self, obj):
        return obj.questions.count()
    
    def get_attempts_count(self, obj):
        return obj.assessmentattempt_set.count()
    
    def get_user_attempts(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.assessmentattempt_set.filter(user=request.user).count()
        return 0
    
    def get_best_score(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            best_attempt = obj.assessmentattempt_set.filter(
                user=request.user, 
                status='completed'
            ).order_by('-score').first()
            return best_attempt.score if best_attempt else None
        return None
    
    def get_has_paid(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.assessmentpayment_set.filter(
                user=request.user, 
                status='completed'
            ).exists()
        return False
    
    def create(self, validated_data):
        # Handle category_id
        category_id = validated_data.pop('category_id', None)
        if category_id:
            try:
                category = AssessmentCategory.objects.get(id=category_id)
                validated_data['category'] = category
            except AssessmentCategory.DoesNotExist:
                raise serializers.ValidationError({'category': 'Invalid category ID'})
        
        # Set created_by to current user
        validated_data['created_by'] = self.context['request'].user
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Handle category_id for updates
        category_id = validated_data.pop('category_id', None)
        if category_id:
            try:
                category = AssessmentCategory.objects.get(id=category_id)
                validated_data['category'] = category
            except AssessmentCategory.DoesNotExist:
                raise serializers.ValidationError({'category': 'Invalid category ID'})
        
        return super().update(instance, validated_data)

class AssessmentPaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    assessment_data = AssessmentSerializer(source='assessment', read_only=True)
    
    class Meta:
        model = AssessmentPayment
        fields = ['id', 'user', 'assessment', 'assessment_data', 'amount', 'payment_reference', 'paystack_reference', 'status', 'paid_at', 'created_at']
        read_only_fields = ['user', 'paid_at']
    
    def create(self, validated_data):
        import uuid
        from django.utils import timezone
        
        validated_data['user'] = self.context['request'].user
        
        # Generate payment reference if not provided
        if not validated_data.get('payment_reference'):
            validated_data['payment_reference'] = str(uuid.uuid4())
        
        # Set paid_at if status is completed
        if validated_data.get('status') == 'completed':
            validated_data['paid_at'] = timezone.now()
        
        return super().create(validated_data)

class AssessmentAttemptSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    assessment = AssessmentSerializer(read_only=True)
    assessment_id = serializers.IntegerField(write_only=True)
    payment_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = AssessmentAttempt
        fields = '__all__'
        read_only_fields = ['user', 'score', 'passed', 'completed_at', 'expires_at']
    
    def create(self, validated_data):
        from django.utils import timezone
        from datetime import timedelta
        
        validated_data['user'] = self.context['request'].user
        assessment = Assessment.objects.get(id=validated_data['assessment_id'])
        
        # Set expiration time based on assessment duration
        validated_data['expires_at'] = timezone.now() + timedelta(minutes=assessment.duration_minutes)
        
        return super().create(validated_data)

class AssessmentAnswerSerializer(serializers.ModelSerializer):
    attempt_id = serializers.IntegerField(write_only=True)
    question_id = serializers.IntegerField(write_only=True)
    selected_option_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = AssessmentAnswer
        fields = '__all__'
        read_only_fields = ['is_correct', 'points_earned', 'answered_at']
    
    def create(self, validated_data):
        # Auto-calculate correctness and points
        question = Question.objects.get(id=validated_data['question_id'])
        
        if validated_data.get('selected_option_id'):
            option = QuestionOption.objects.get(id=validated_data['selected_option_id'])
            validated_data['is_correct'] = option.is_correct
            validated_data['points_earned'] = question.points if option.is_correct else 0
        else:
            # For text/coding questions, manual grading needed
            validated_data['is_correct'] = None
            validated_data['points_earned'] = 0
        
        return super().create(validated_data)

class SkillBadgeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    assessment = AssessmentSerializer(read_only=True)
    attempt = AssessmentAttemptSerializer(read_only=True)
    
    class Meta:
        model = SkillBadge
        fields = '__all__'
        read_only_fields = ['earned_at']

class AssessmentResultSerializer(serializers.Serializer):
    score = serializers.IntegerField()
    passed = serializers.BooleanField()
    total_points = serializers.IntegerField()
    earned_points = serializers.IntegerField()
    badge_earned = SkillBadgeSerializer(required=False)
    time_spent = serializers.IntegerField()
    correct_answers = serializers.IntegerField()
    total_questions = serializers.IntegerField()

