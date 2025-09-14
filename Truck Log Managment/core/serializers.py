"""
Serializers for the core app
"""

from rest_framework import serializers
from .models import Trip, Stop, LogEntry


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = ['id', 'current_location', 'pickup_location', 'dropoff_location', 'cycle_hours', 'created_at']


class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = ['id', 'trip', 'location', 'type', 'start_time', 'end_time']


class LogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LogEntry
        fields = ['id', 'trip', 'day', 'status', 'start_hour', 'end_hour', 'location']
