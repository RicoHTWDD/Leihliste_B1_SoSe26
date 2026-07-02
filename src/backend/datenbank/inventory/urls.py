from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GegenstandsexemplarViewSet, VerfügbareGegenstandsexemplarViewSet, GegenstandsexemplarDetailViewSet

router = DefaultRouter()
router.register(r'alle-exemplare', GegenstandsexemplarViewSet, basename='exemplare')
router.register(r'verfuegbare-exemplare', VerfügbareGegenstandsexemplarViewSet, basename='verfuegbare-exemplare')
router.register(r'exemplare', GegenstandsexemplarDetailViewSet, basename='exemplar-detail')

urlpatterns = [
    path('', include(router.urls)),
]