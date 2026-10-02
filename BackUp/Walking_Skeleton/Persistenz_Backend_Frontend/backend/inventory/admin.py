from django.contrib import admin
from .models import Item


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "location", "status")
    list_filter = ("status", "category")
    search_fields = ("name", "category", "location")
