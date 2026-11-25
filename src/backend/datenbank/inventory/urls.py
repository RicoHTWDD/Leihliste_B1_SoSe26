from django.urls import path, include
from rest_framework.routers import DefaultRouter
from inventory.controller.views import GegenstandsexemplarViewSet, VerfügbareGegenstandsexemplarViewSet, GegenstandsexemplarDetailViewSet, GegenstandstypViewSet, StandortViewSet

router = DefaultRouter()
router.register(r'alle-exemplare', GegenstandsexemplarViewSet, basename='exemplare')
router.register(r'verfuegbare-exemplare', VerfügbareGegenstandsexemplarViewSet, basename='verfuegbare-exemplare')
router.register(r'exemplare', GegenstandsexemplarDetailViewSet, basename='exemplar-detail')
router.register(r'typen', GegenstandstypViewSet, basename='typen')
router.register(r'standorte', StandortViewSet, basename='standorte')

urlpatterns = [
    path('', include(router.urls)),
]