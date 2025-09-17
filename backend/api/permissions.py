from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    """
    Permission class to check if user is admin
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff