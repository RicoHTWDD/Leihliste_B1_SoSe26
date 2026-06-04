from rest_framework import generics
from .models import Note
from .serializers import NoteSerializer
from .export import export_nodes_to_json

class NoteListCreateView(generics.ListCreateAPIView):
    queryset = Note.objects.order_by("-created_at")
    serializer_class = NoteSerializer