from django.db import models
from django.utils import timezone


class Trip(models.Model):
    """Model representing a truck trip"""
    current_location = models.CharField(max_length=255, help_text="Current location of the truck")
    pickup_location = models.CharField(max_length=255, help_text="Location where the trip started")
    dropoff_location = models.CharField(max_length=255, help_text="Final destination of the trip")
    cycle_hours = models.DecimalField(max_digits=5, decimal_places=2, help_text="Total cycle hours for this trip")
    created_at = models.DateTimeField(default=timezone.now, help_text="When this trip was created")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Trip"
        verbose_name_plural = "Trips"
    
    def __str__(self):
        return f"Trip {self.id}: {self.pickup_location} to {self.dropoff_location}"


class Stop(models.Model):
    """Model representing stops during a trip"""
    STOP_TYPE_CHOICES = [
        ('pickup', 'Pickup'),
        ('dropoff', 'Dropoff'),
        ('fuel', 'Fuel'),
        ('rest', 'Rest'),
    ]
    
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stops', help_text="The trip this stop belongs to")
    location = models.CharField(max_length=255, help_text="Location of the stop")
    type = models.CharField(max_length=10, choices=STOP_TYPE_CHOICES, help_text="Type of stop")
    start_time = models.DateTimeField(help_text="When the stop started")
    end_time = models.DateTimeField(help_text="When the stop ended", null=True, blank=True)
    
    class Meta:
        ordering = ['start_time']
        verbose_name = "Stop"
        verbose_name_plural = "Stops"
    
    def __str__(self):
        return f"{self.get_type_display()} at {self.location}"


class LogEntry(models.Model):
    """Model representing daily log entries for a trip"""
    STATUS_CHOICES = [
        ('off', 'Off'),
        ('sleeper', 'Sleeper'),
        ('driving', 'Driving'),
        ('on-duty', 'On-Duty'),
    ]
    
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='log_entries', help_text="The trip this log entry belongs to")
    day = models.DateField(help_text="Date of the log entry")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, help_text="Status during this period")
    start_hour = models.TimeField(help_text="Start time of this status period")
    end_hour = models.TimeField(help_text="End time of this status period")
    location = models.CharField(max_length=255, help_text="Location during this period")
    
    class Meta:
        ordering = ['day', 'start_hour']
        verbose_name = "Log Entry"
        verbose_name_plural = "Log Entries"
        unique_together = ['trip', 'day', 'start_hour']  # Prevent overlapping entries
    
    def __str__(self):
        return f"{self.trip} - {self.day}: {self.get_status_display()} ({self.start_hour}-{self.end_hour})"
