from django.contrib import admin
from .models import Trip, Stop, LogEntry


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['id', 'pickup_location', 'dropoff_location', 'current_location', 'cycle_hours', 'created_at']
    list_filter = ['created_at']
    search_fields = ['pickup_location', 'dropoff_location', 'current_location']
    readonly_fields = ['created_at']


@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ['trip', 'location', 'type', 'start_time', 'end_time']
    list_filter = ['type', 'start_time']
    search_fields = ['location', 'trip__pickup_location', 'trip__dropoff_location']
    raw_id_fields = ['trip']


@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    list_display = ['trip', 'day', 'status', 'start_hour', 'end_hour', 'location']
    list_filter = ['status', 'day']
    search_fields = ['location', 'trip__pickup_location', 'trip__dropoff_location']
    raw_id_fields = ['trip']
