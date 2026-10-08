from django.urls import path
from .views import NoteListCreateView

urlpatterns = [
    path("notes/", NoteListCreateView.as_view(), name="notes-list-create"),
]