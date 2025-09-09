#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Notification

print("=== All Users ===")
for user in User.objects.all():
    print(f"Username: {user.username}, ID: {user.id}")

print("\n=== All Notifications ===")
for notif in Notification.objects.all():
    print(f"ID: {notif.id}, User: {notif.user.username} (ID: {notif.user.id}), Title: {notif.title}")

print("\n=== Notifications by User ===")
for user in User.objects.all():
    count = Notification.objects.filter(user=user).count()
    if count > 0:
        print(f"{user.username}: {count} notifications")
        for notif in Notification.objects.filter(user=user):
            print(f"  - {notif.title}: {notif.message}")