from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GegenstandsexemplarViewSet, VerfügbareGegenstandsexemplarViewSet

router = DefaultRouter()
router.register(r'alle-exemplare', GegenstandsexemplarViewSet, basename='exemplare')
router.register(r'verfuegbare-exemplare', VerfügbareGegenstandsexemplarViewSet, basename='verfuegbare-exemplare')

urlpatterns = [
    path('', include(router.urls)),
]