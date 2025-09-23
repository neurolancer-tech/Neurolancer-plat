"""
URL configuration for neurolancer_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        'message': 'Neurolancer API is running',
        'version': '1.0.0',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
            'categories': '/api/categories/',
            'gigs': '/api/gigs/',
            'auth': '/api/auth/',
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    # Prioritize payments routes to avoid overlap with general api include
    path('api/payments/', include('api.payment_urls')),
    path('api/', include('api.urls')),
    path('api/', include('api.newsletter_urls')),
]

# Serve media files in all environments (temporary for Render);
# consider moving to S3 or a persistent disk in production.
urpatterns_media = static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urpatterns_static = static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) if settings.DEBUG else []
urlpatterns += urpatterns_media + urpatterns_static
