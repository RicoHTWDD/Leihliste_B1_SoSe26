from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AusleihanfrageViewSet

router = DefaultRouter()
router.register(r'anfragen', AusleihanfrageViewSet, basename='anfrage')

urlpatterns = [
    path('', include(router.urls)),
]