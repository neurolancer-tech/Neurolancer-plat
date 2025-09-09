import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import Lesson

# Sample video URLs (using actual YouTube videos for testing)
sample_videos = [
    "https://www.youtube.com/watch?v=aircAruvnKk",  # Neural Networks Explained
    "https://www.youtube.com/watch?v=IHZwWFHWa-w",  # Machine Learning Explained
    "https://www.youtube.com/watch?v=VyWAvY2CF9c",  # Deep Learning Basics
    "https://www.youtube.com/watch?v=kft1AJ9WVDk",  # Computer Vision Intro
    "https://www.youtube.com/watch?v=fNxaJsNG3-s",  # NLP Fundamentals
]

# Update lessons with video URLs
lessons = Lesson.objects.filter(lesson_type='video')
print(f"Found {lessons.count()} video lessons to update")

for i, lesson in enumerate(lessons):
    # Cycle through sample videos
    video_url = sample_videos[i % len(sample_videos)]
    lesson.video_url = video_url
    lesson.save()
    print(f"Updated lesson {lesson.id}: {lesson.title} -> {video_url}")

print(f"\nUpdated {lessons.count()} lessons with video URLs!")