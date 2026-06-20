from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GegenstandsexemplarViewSet

router = DefaultRouter()
router.register(r'exemplare', GegenstandsexemplarViewSet, basename='exemplar')

urlpatterns = [
    path('', include(router.urls)),
]