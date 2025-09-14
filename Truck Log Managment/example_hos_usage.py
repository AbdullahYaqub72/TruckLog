#!/usr/bin/env python3
"""
Example usage of the HOS (Hours of Service) scheduling service
"""

import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'triplogs.settings')
django.setup()

from core.models import Trip, Stop, LogEntry
from core.hos import schedule_trip_hos, HOSScheduler


def example_short_trip():
    """Example: Short trip (no break needed)"""
    print("🚛 Example 1: Short Trip (No Break Required)")
    print("=" * 50)
    
    trip = Trip.objects.create(
        current_location="Chicago, IL",
        pickup_location="Chicago, IL",
        dropoff_location="Detroit, MI", 
        cycle_hours=Decimal('0.00')
    )
    
    # 300 miles at 50 mph = 6 hours driving
    stops, log_entries = schedule_trip_hos(trip, 300.0, datetime(2024, 1, 1, 6, 0), 50.0)
    
    print(f"Trip: {trip.pickup_location} → {trip.dropoff_location}")
    print(f"Distance: 300 miles")
    print(f"Stops: {len(stops)}, Log entries: {len(log_entries)}")
    
    for entry in log_entries:
        duration = datetime.combine(entry.day, entry.end_hour) - datetime.combine(entry.day, entry.start_hour)
        hours = duration.total_seconds() / 3600
        print(f"  {entry.start_hour.strftime('%H:%M')} - {entry.end_hour.strftime('%H:%M')} | {entry.status.upper():10} | {hours:.1f}h")
    
    trip.delete()
    print()


def example_medium_trip():
    """Example: Medium trip (30-minute break required)"""
    print("🚛 Example 2: Medium Trip (30-minute Break Required)")
    print("=" * 55)
    
    trip = Trip.objects.create(
        current_location="New York, NY",
        pickup_location="New York, NY",
        dropoff_location="Atlanta, GA", 
        cycle_hours=Decimal('0.00')
    )
    
    # 500 miles at 50 mph = 10 hours driving
    stops, log_entries = schedule_trip_hos(trip, 500.0, datetime(2024, 1, 1, 6, 0), 50.0)
    
    print(f"Trip: {trip.pickup_location} → {trip.dropoff_location}")
    print(f"Distance: 500 miles")
    print(f"Stops: {len(stops)}, Log entries: {len(log_entries)}")
    
    print("\nStops:")
    for stop in stops:
        duration = stop.end_time - stop.start_time
        print(f"  {stop.start_time.strftime('%H:%M')} - {stop.end_time.strftime('%H:%M')} | {stop.type.upper():8} | {duration}")
    
    print("\nLog Entries:")
    for entry in log_entries:
        duration = datetime.combine(entry.day, entry.end_hour) - datetime.combine(entry.day, entry.start_hour)
        hours = duration.total_seconds() / 3600
        print(f"  {entry.start_hour.strftime('%H:%M')} - {entry.end_hour.strftime('%H:%M')} | {entry.status.upper():10} | {hours:.1f}h")
    
    trip.delete()
    print()


def example_long_trip():
    """Example: Long trip (multiple days, sleeper berth)"""
    print("🚛 Example 3: Long Trip (Multiple Days)")
    print("=" * 45)
    
    trip = Trip.objects.create(
        current_location="New York, NY",
        pickup_location="New York, NY",
        dropoff_location="Los Angeles, CA", 
        cycle_hours=Decimal('0.00')
    )
    
    # 2800 miles at 50 mph = 56 hours driving
    stops, log_entries = schedule_trip_hos(trip, 2800.0, datetime(2024, 1, 1, 6, 0), 50.0)
    
    print(f"Trip: {trip.pickup_location} → {trip.dropoff_location}")
    print(f"Distance: 2800 miles")
    print(f"Stops: {len(stops)}, Log entries: {len(log_entries)}")
    
    # Group by day
    entries_by_day = {}
    for entry in log_entries:
        day = entry.day
        if day not in entries_by_day:
            entries_by_day[day] = []
        entries_by_day[day].append(entry)
    
    print(f"\nTrip spans {len(entries_by_day)} days:")
    for day in sorted(entries_by_day.keys()):
        day_entries = sorted(entries_by_day[day], key=lambda x: x.start_hour)
        driving_hours = sum(
            (datetime.combine(e.day, e.end_hour) - datetime.combine(e.day, e.start_hour)).total_seconds() / 3600
            for e in day_entries if e.status == 'driving'
        )
        print(f"  {day.strftime('%A, %B %d')}: {driving_hours:.1f}h driving, {len(day_entries)} log entries")
    
    trip.delete()
    print()


def example_custom_constraints():
    """Example: Using custom HOS constraints"""
    print("🚛 Example 4: Custom HOS Constraints")
    print("=" * 40)
    
    from core.hos import HOSConstraints
    
    # Create custom constraints (more restrictive)
    custom_constraints = HOSConstraints(
        max_driving_hours=8,  # More restrictive than standard 11
        max_duty_hours=12,    # More restrictive than standard 14
        break_after_driving_hours=6,  # Break after 6 hours instead of 8
        break_duration_minutes=45,    # Longer break
    )
    
    trip = Trip.objects.create(
        current_location="Miami, FL",
        pickup_location="Miami, FL",
        dropoff_location="Orlando, FL", 
        cycle_hours=Decimal('0.00')
    )
    
    # 250 miles at 50 mph = 5 hours driving
    scheduler = HOSScheduler(custom_constraints)
    stops, log_entries = scheduler.calculate_trip_schedule(trip, 250.0, datetime(2024, 1, 1, 6, 0), 50.0)
    
    print(f"Trip: {trip.pickup_location} → {trip.dropoff_location}")
    print(f"Custom constraints: {custom_constraints.max_driving_hours}h driving max, {custom_constraints.max_duty_hours}h duty max")
    print(f"Stops: {len(stops)}, Log entries: {len(log_entries)}")
    
    for entry in log_entries:
        duration = datetime.combine(entry.day, entry.end_hour) - datetime.combine(entry.day, entry.start_hour)
        hours = duration.total_seconds() / 3600
        print(f"  {entry.start_hour.strftime('%H:%M')} - {entry.end_hour.strftime('%H:%M')} | {entry.status.upper():10} | {hours:.1f}h")
    
    trip.delete()
    print()


def main():
    """Run all examples"""
    print("🚛 Hours of Service (HOS) Scheduling Service Examples")
    print("=" * 60)
    print()
    
    example_short_trip()
    example_medium_trip()
    example_long_trip()
    example_custom_constraints()
    
    print("✅ All examples completed successfully!")
    print("\nKey Features Demonstrated:")
    print("• 11-hour daily driving limit")
    print("• 14-hour duty window")
    print("• 30-minute break after 8 hours driving")
    print("• 10-hour sleeper berth requirement")
    print("• 70/8 rolling rule validation")
    print("• Custom constraint support")


if __name__ == "__main__":
    main()
