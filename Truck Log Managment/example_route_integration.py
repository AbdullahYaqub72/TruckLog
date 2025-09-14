#!/usr/bin/env python3
"""
Example demonstrating the integrated route calculation and HOS scheduling
"""

import os
import sys
import django
from datetime import datetime
from decimal import Decimal

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'triplogs.settings')
django.setup()

from core.models import Trip, Stop, LogEntry
from core.route_service import calculate_route
from core.hos import schedule_trip_with_route


def example_short_route():
    """Example: Short route (no fuel stops needed)"""
    print("🚛 Example 1: Short Route (No Fuel Stops)")
    print("=" * 50)
    
    # Calculate route
    result = calculate_route("New York, NY", "Philadelphia, PA", 1000.0)
    
    print(f"Route: {result['waypoints'][0]['name']} → {result['waypoints'][-1]['name']}")
    print(f"Distance: {result['route']['distance_miles']} miles")
    print(f"Duration: {result['route']['duration_hours']} hours")
    print(f"Driving time: {result['route']['driving_hours']} hours")
    print(f"Stops time: {result['route']['stops_hours']} hours")
    print()
    
    print("Waypoints:")
    for i, wp in enumerate(result['waypoints'], 1):
        print(f"  {i}. {wp['name']} ({wp['type']})")
    
    print()


def example_long_route():
    """Example: Long route with fuel stops"""
    print("🚛 Example 2: Long Route (With Fuel Stops)")
    print("=" * 50)
    
    # Calculate route
    result = calculate_route("New York, NY", "Los Angeles, CA", 1000.0)
    
    print(f"Route: {result['waypoints'][0]['name']} → {result['waypoints'][-1]['name']}")
    print(f"Distance: {result['route']['distance_miles']} miles")
    print(f"Duration: {result['route']['duration_hours']} hours")
    print(f"Driving time: {result['route']['driving_hours']} hours")
    print(f"Stops time: {result['route']['stops_hours']} hours")
    print()
    
    # Count different types of stops
    stop_types = {}
    for wp in result['waypoints']:
        stop_types[wp['type']] = stop_types.get(wp['type'], 0) + 1
    
    print("Stop breakdown:")
    for stop_type, count in stop_types.items():
        print(f"  - {stop_type}: {count}")
    
    print()
    print("Waypoints:")
    for i, wp in enumerate(result['waypoints'], 1):
        print(f"  {i}. {wp['name']} ({wp['type']})")
    
    print()


def example_hos_with_route():
    """Example: HOS scheduling with route calculation"""
    print("🚛 Example 3: HOS Scheduling with Route Calculation")
    print("=" * 60)
    
    # Create trip
    trip = Trip.objects.create(
        current_location="New York, NY",
        pickup_location="New York, NY",
        dropoff_location="Atlanta, GA",
        cycle_hours=Decimal('0.00')
    )
    
    # Schedule with route calculation
    start_time = datetime(2024, 1, 1, 6, 0)
    route_info, stops, log_entries = schedule_trip_with_route(
        trip, start_time, 1000.0
    )
    
    print(f"Trip: {trip.pickup_location} → {trip.dropoff_location}")
    print(f"Route distance: {route_info['route']['distance_miles']} miles")
    print(f"Route duration: {route_info['route']['duration_hours']} hours")
    print(f"Total stops: {len(stops)}")
    print(f"Log entries: {len(log_entries)}")
    print()
    
    # Show route waypoints
    print("Route waypoints:")
    for i, wp in enumerate(route_info['waypoints'], 1):
        print(f"  {i}. {wp['name']} ({wp['type']})")
    
    print()
    
    # Show stops by type
    stop_types = {}
    for stop in stops:
        stop_types[stop.type] = stop_types.get(stop.type, 0) + 1
    
    print("Scheduled stops:")
    for stop_type, count in stop_types.items():
        print(f"  - {stop_type}: {count}")
    
    print()
    
    # Show log entries by day
    entries_by_day = {}
    for entry in log_entries:
        day = entry.day
        if day not in entries_by_day:
            entries_by_day[day] = []
        entries_by_day[day].append(entry)
    
    print("Daily log entries:")
    for day in sorted(entries_by_day.keys()):
        day_entries = sorted(entries_by_day[day], key=lambda x: x.start_hour)
        driving_hours = sum(
            (datetime.combine(e.day, e.end_hour) - datetime.combine(e.day, e.start_hour)).total_seconds() / 3600
            for e in day_entries if e.status == 'driving'
        )
        print(f"  {day.strftime('%A, %B %d')}: {driving_hours:.1f}h driving, {len(day_entries)} entries")
    
    # Clean up
    trip.delete()
    print()


def example_custom_fuel_interval():
    """Example: Custom fuel stop interval"""
    print("🚛 Example 4: Custom Fuel Stop Interval")
    print("=" * 45)
    
    # Calculate route with 500-mile fuel stops
    result = calculate_route("New York, NY", "Los Angeles, CA", 500.0)
    
    print(f"Route: {result['waypoints'][0]['name']} → {result['waypoints'][-1]['name']}")
    print(f"Distance: {result['route']['distance_miles']} miles")
    print(f"Fuel stop interval: 500 miles")
    print()
    
    # Count fuel stops
    fuel_stops = [wp for wp in result['waypoints'] if wp['type'] == 'fuel']
    print(f"Fuel stops: {len(fuel_stops)}")
    
    for i, fuel_stop in enumerate(fuel_stops, 1):
        print(f"  {i}. {fuel_stop['name']}")
    
    print()


def main():
    """Run all examples"""
    print("🗺️  Route Calculation and HOS Integration Examples")
    print("=" * 60)
    print()
    
    example_short_route()
    example_long_route()
    example_hos_with_route()
    example_custom_fuel_interval()
    
    print("✅ All examples completed successfully!")
    print()
    print("Key Features Demonstrated:")
    print("• Real-time route calculation using OSRM")
    print("• Automatic fuel stops every 1,000 miles")
    print("• Pickup and dropoff stops (1 hour each)")
    print("• HOS-compliant scheduling with route data")
    print("• Distance and duration calculation")
    print("• Multiple stop types (fuel, pickup, dropoff, rest)")
    print("• Integration with existing HOS regulations")


if __name__ == "__main__":
    main()
