from django.db import models

class Note(models.Model):
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Note({self.id})"

# Create your models here.
