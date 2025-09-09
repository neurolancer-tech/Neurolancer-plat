from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Count, Avg
from datetime import timedelta
import uuid

from .models import (
    AssessmentCategory, Assessment, Question, QuestionOption, 
    AssessmentPayment, AssessmentAttempt, AssessmentAnswer, SkillBadge
)
from .serializers import (
    AssessmentCategorySerializer, AssessmentSerializer, QuestionSerializer,
    AssessmentPaymentSerializer, AssessmentAttemptSerializer, AssessmentAnswerSerializer,
    SkillBadgeSerializer, AssessmentResultSerializer
)
from .models import User

# Assessment Categories
class AssessmentCategoryListView(generics.ListAPIView):
    queryset = AssessmentCategory.objects.all()
    serializer_class = AssessmentCategorySerializer
    permission_classes = [permissions.AllowAny]

# Assessments
class AssessmentListView(generics.ListAPIView):
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Assessment.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        difficulty = self.request.query_params.get('difficulty')
        
        if category:
            queryset = queryset.filter(category_id=category)
        if difficulty:
            queryset = queryset.filter(difficulty_level=difficulty)
            
        return queryset.order_by('-created_at')

class AssessmentDetailView(generics.RetrieveAPIView):
    queryset = Assessment.objects.filter(is_active=True)
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.AllowAny]

# Admin Assessment Management
class AdminAssessmentListView(generics.ListCreateAPIView):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        return Assessment.objects.all().order_by('-created_at')

class AdminAssessmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminAssessmentAttemptListView(generics.ListAPIView):
    queryset = AssessmentAttempt.objects.filter(status='completed').order_by('-completed_at')
    serializer_class = AssessmentAttemptSerializer
    permission_classes = [permissions.IsAdminUser]

# Payment
class AssessmentPaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = AssessmentPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AssessmentPayment.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_assessment_payment(request):
    """Verify payment status"""
    payment_reference = request.data.get('payment_reference')
    
    if not payment_reference:
        return Response({'error': 'Payment reference required'}, status=status.HTTP_400_BAD_REQUEST)
    
    payment = get_object_or_404(AssessmentPayment, payment_reference=payment_reference)
    
    return Response({
        'payment_id': payment.id,
        'status': payment.status,
        'paid_at': payment.paid_at,
        'can_take_assessment': payment.status == 'completed'
    })

# Assessment Taking
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_assessment(request, assessment_id):
    """Start an assessment attempt"""
    assessment = get_object_or_404(Assessment, id=assessment_id, is_active=True)
    
    # Check if user has paid for this assessment
    payment = AssessmentPayment.objects.filter(
        user=request.user,
        assessment=assessment,
        status='completed'
    ).first()
    
    if not payment:
        return Response({'error': 'Payment required to take this assessment'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user has an active attempt
    active_attempt = AssessmentAttempt.objects.filter(
        user=request.user,
        assessment=assessment,
        status='in_progress',
        expires_at__gt=timezone.now()
    ).first()
    
    if active_attempt:
        return Response({
            'attempt_id': active_attempt.id,
            'expires_at': active_attempt.expires_at,
            'time_remaining': (active_attempt.expires_at - timezone.now()).total_seconds()
        })
    
    # Create new attempt
    attempt = AssessmentAttempt.objects.create(
        user=request.user,
        assessment=assessment,
        payment=payment,
        expires_at=timezone.now() + timedelta(minutes=assessment.duration_minutes)
    )
    
    return Response({
        'attempt_id': attempt.id,
        'expires_at': attempt.expires_at,
        'time_remaining': assessment.duration_minutes * 60
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_assessment_questions(request, assessment_id):
    """Get questions for an assessment"""
    assessment = get_object_or_404(Assessment, id=assessment_id, is_active=True)
    
    # Check if user has an active attempt
    attempt = AssessmentAttempt.objects.filter(
        user=request.user,
        assessment=assessment,
        status='in_progress',
        expires_at__gt=timezone.now()
    ).first()
    
    if not attempt:
        return Response({'error': 'No active attempt found'}, status=status.HTTP_400_BAD_REQUEST)
    
    questions = assessment.questions.all().order_by('order')
    serializer = QuestionSerializer(questions, many=True)
    
    return Response({
        'questions': serializer.data,
        'attempt_id': attempt.id,
        'time_remaining': (attempt.expires_at - timezone.now()).total_seconds()
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_answer(request, attempt_id):
    """Submit an answer for a question"""
    attempt = get_object_or_404(
        AssessmentAttempt, 
        id=attempt_id, 
        user=request.user, 
        status='in_progress'
    )
    
    # Check if attempt is still valid
    if attempt.expires_at <= timezone.now():
        attempt.status = 'expired'
        attempt.save()
        return Response({'error': 'Assessment time has expired'}, status=status.HTTP_400_BAD_REQUEST)
    
    question_id = request.data.get('question_id')
    selected_option_id = request.data.get('selected_option_id')
    text_answer = request.data.get('text_answer', '')
    
    if not question_id:
        return Response({'error': 'Question ID required'}, status=status.HTTP_400_BAD_REQUEST)
    
    question = get_object_or_404(Question, id=question_id, assessment=attempt.assessment)
    
    # Check if answer already exists
    existing_answer = AssessmentAnswer.objects.filter(
        attempt=attempt,
        question=question
    ).first()
    
    if existing_answer:
        # Update existing answer
        if selected_option_id:
            option = get_object_or_404(QuestionOption, id=selected_option_id, question=question)
            existing_answer.selected_option = option
            existing_answer.is_correct = option.is_correct
            existing_answer.points_earned = question.points if option.is_correct else 0
        else:
            existing_answer.text_answer = text_answer
            existing_answer.is_correct = None  # Manual grading needed
            existing_answer.points_earned = 0
        
        existing_answer.save()
        answer = existing_answer
    else:
        # Create new answer
        answer_data = {
            'attempt': attempt,
            'question': question,
            'text_answer': text_answer
        }
        
        if selected_option_id:
            option = get_object_or_404(QuestionOption, id=selected_option_id, question=question)
            answer_data['selected_option'] = option
            answer_data['is_correct'] = option.is_correct
            answer_data['points_earned'] = question.points if option.is_correct else 0
        else:
            answer_data['is_correct'] = None  # Manual grading needed
            answer_data['points_earned'] = 0
        
        answer = AssessmentAnswer.objects.create(**answer_data)
    
    return Response({'success': True, 'answer_id': answer.id})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_assessment(request, attempt_id):
    """Submit final assessment"""
    attempt = get_object_or_404(
        AssessmentAttempt, 
        id=attempt_id, 
        user=request.user, 
        status='in_progress'
    )
    
    # Calculate results
    answers = attempt.answers.all()
    total_points = attempt.assessment.questions.aggregate(
        total=Count('points')
    )['total'] or 0
    
    earned_points = sum(answer.points_earned for answer in answers if answer.points_earned)
    score_percentage = int((earned_points / total_points * 100)) if total_points > 0 else 0
    passed = score_percentage >= attempt.assessment.passing_score
    
    # Update attempt
    attempt.status = 'completed'
    attempt.completed_at = timezone.now()
    attempt.score = score_percentage
    attempt.total_points = total_points
    attempt.earned_points = earned_points
    attempt.passed = passed
    attempt.time_spent_minutes = int((timezone.now() - attempt.started_at).total_seconds() / 60)
    attempt.save()
    
    # Create badge if passed
    badge = None
    if passed:
        # Determine badge level based on score
        if score_percentage >= 95:
            badge_level = 'platinum'
        elif score_percentage >= 85:
            badge_level = 'gold'
        elif score_percentage >= 75:
            badge_level = 'silver'
        else:
            badge_level = 'bronze'
        
        badge = SkillBadge.objects.create(
            user=request.user,
            assessment=attempt.assessment,
            attempt=attempt,
            badge_level=badge_level,
            score_percentage=score_percentage
        )
    
    # Prepare result data
    result_data = {
        'score': score_percentage,
        'passed': passed,
        'total_points': total_points,
        'earned_points': earned_points,
        'time_spent': attempt.time_spent_minutes,
        'correct_answers': answers.filter(is_correct=True).count(),
        'total_questions': attempt.assessment.questions.count()
    }
    
    if badge:
        result_data['badge_earned'] = SkillBadgeSerializer(badge).data
    
    return Response(result_data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_assessment_result(request, attempt_id):
    """Get assessment result"""
    attempt = get_object_or_404(
        AssessmentAttempt, 
        id=attempt_id, 
        user=request.user, 
        status='completed'
    )
    
    badge = SkillBadge.objects.filter(attempt=attempt).first()
    
    result_data = {
        'score': attempt.score,
        'passed': attempt.passed,
        'total_points': attempt.total_points,
        'earned_points': attempt.earned_points,
        'time_spent': attempt.time_spent_minutes,
        'correct_answers': attempt.answers.filter(is_correct=True).count(),
        'total_questions': attempt.assessment.questions.count()
    }
    
    if badge:
        result_data['badge_earned'] = SkillBadgeSerializer(badge).data
    
    return Response(result_data)

# User Assessment History
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_assessment_history(request):
    """Get user's assessment history"""
    attempts = AssessmentAttempt.objects.filter(
        user=request.user,
        status='completed'
    ).order_by('-completed_at')
    
    serializer = AssessmentAttemptSerializer(attempts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_skill_badges(request):
    """Get user's skill badges"""
    badges = SkillBadge.objects.filter(
        user=request.user,
        is_displayed=True
    ).order_by('-earned_at')
    
    serializer = SkillBadgeSerializer(badges, many=True)
    return Response(serializer.data)

# Admin Views
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def assessment_analytics(request):
    """Get assessment analytics for admin"""
    total_assessments = Assessment.objects.filter(is_active=True).count()
    total_attempts = AssessmentAttempt.objects.count()
    completed_attempts = AssessmentAttempt.objects.filter(status='completed').count()
    passed_attempts = AssessmentAttempt.objects.filter(status='completed', passed=True).count()
    
    # Average scores by assessment
    assessment_stats = Assessment.objects.filter(is_active=True).annotate(
        avg_score=Avg('assessmentattempt__score'),
        attempt_count=Count('assessmentattempt'),
        pass_rate=Avg('assessmentattempt__passed')
    ).values('title', 'avg_score', 'attempt_count', 'pass_rate')
    
    return Response({
        'total_assessments': total_assessments,
        'total_attempts': total_attempts,
        'completed_attempts': completed_attempts,
        'passed_attempts': passed_attempts,
        'completion_rate': (completed_attempts / total_attempts * 100) if total_attempts > 0 else 0,
        'pass_rate': (passed_attempts / completed_attempts * 100) if completed_attempts > 0 else 0,
        'assessment_stats': list(assessment_stats)
    })

# Question Management
class AdminQuestionListView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        assessment_id = self.request.query_params.get('assessment')
        if assessment_id:
            return Question.objects.filter(assessment_id=assessment_id).order_by('order')
        return Question.objects.all().order_by('assessment', 'order')

class AdminQuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAdminUser]

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def get_assessment_questions_admin(request, assessment_id):
    """Get questions for an assessment (admin view)"""
    assessment = get_object_or_404(Assessment, id=assessment_id)
    questions = assessment.questions.all().order_by('order')
    
    questions_data = []
    for question in questions:
        question_data = {
            'id': question.id,
            'question_text': question.question_text,
            'question_type': question.question_type,
            'points': question.points,
            'order': question.order,
            'is_required': question.is_required,
            'options': []
        }
        
        if question.question_type == 'multiple_choice':
            options = question.options.all().order_by('order')
            question_data['options'] = [{
                'id': opt.id,
                'option_text': opt.option_text,
                'is_correct': opt.is_correct,
                'order': opt.order
            } for opt in options]
        
        questions_data.append(question_data)
    
    return Response(questions_data)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def create_question(request):
    """Create a new question"""
    assessment_id = request.data.get('assessment_id') or request.data.get('assessment')
    if not assessment_id:
        return Response({'error': 'Assessment ID required'}, status=status.HTTP_400_BAD_REQUEST)
    
    assessment = get_object_or_404(Assessment, id=assessment_id)
    
    question_data = {
        'assessment': assessment,
        'question_text': request.data.get('question_text'),
        'question_type': request.data.get('question_type', 'multiple_choice'),
        'points': request.data.get('points', 1),
        'order': request.data.get('order', assessment.questions.count() + 1),
        'is_required': request.data.get('is_required', True)
    }
    
    question = Question.objects.create(**question_data)
    
    return Response({
        'id': question.id,
        'message': 'Question created successfully'
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def create_question_option(request):
    """Create a question option"""
    question_id = request.data.get('question_id') or request.data.get('question')
    if not question_id:
        return Response({'error': 'Question ID required'}, status=status.HTTP_400_BAD_REQUEST)
    
    question = get_object_or_404(Question, id=question_id)
    
    option_data = {
        'question': question,
        'option_text': request.data.get('option_text'),
        'is_correct': request.data.get('is_correct', False),
        'order': request.data.get('order', question.options.count() + 1)
    }
    
    option = QuestionOption.objects.create(**option_data)
    
    return Response({
        'id': option.id,
        'message': 'Option created successfully'
    }, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([permissions.IsAdminUser])
def delete_question(request, question_id):
    """Delete a question"""
    question = get_object_or_404(Question, id=question_id)
    question.delete()
    return Response({'message': 'Question deleted successfully'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_badges(request):
    """Get badges for a specific user (for freelancer profile view)"""
    user_id = request.query_params.get('user')
    if user_id:
        user = get_object_or_404(User, id=user_id)
        badges = SkillBadge.objects.filter(user=user, is_displayed=True).order_by('-earned_at')
    else:
        badges = SkillBadge.objects.filter(user=request.user, is_displayed=True).order_by('-earned_at')
    
    serializer = SkillBadgeSerializer(badges, many=True)
    return Response(serializer.data)