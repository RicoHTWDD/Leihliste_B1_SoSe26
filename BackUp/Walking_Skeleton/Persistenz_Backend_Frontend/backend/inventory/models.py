from django.db import models


class Item(models.Model):
    STATUS_CHOICES = [
        ("available", "Verfügbar"),
        ("requested", "Angefragt"),
        ("borrowed", "Ausgeliehen"),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="available",
    )

    def __str__(self):
        return self.name
