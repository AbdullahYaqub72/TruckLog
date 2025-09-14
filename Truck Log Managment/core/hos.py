"""
Hours of Service (HOS) Scheduling Service

This module implements DOT Hours of Service regulations for commercial truck drivers:
- 11-hour driving limit per day
- 14-hour duty window
- 30-minute break after 8 hours of driving
- 70/8 rolling rule (70 hours in 8 days)
- 10-hour sleeper berth requirement
"""

from datetime import datetime, timedelta, time, date
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass
from decimal import Decimal
import math

from .models import Trip, Stop, LogEntry
from .route_service import RouteCalculator


@dataclass
class HOSConstraints:
    """HOS regulation constraints"""
    max_driving_hours: int = 11
    max_duty_hours: int = 14
    break_after_driving_hours: int = 8
    break_duration_minutes: int = 30
    sleeper_berth_hours: int = 10
    max_hours_8_days: int = 70
    max_hours_7_days: int = 60


@dataclass
class ScheduleEvent:
    """Represents a scheduled event in the HOS timeline"""
    start_time: datetime
    end_time: datetime
    event_type: str  # 'driving', 'break', 'sleeper', 'on_duty'
    location: str
    description: str = ""


class HOSScheduler:
    """Hours of Service scheduler that creates compliant schedules"""
    
    def __init__(self, constraints: HOSConstraints = None):
        self.constraints = constraints or HOSConstraints()
    
    def calculate_trip_schedule(
        self, 
        trip: Trip, 
        distance_miles: float, 
        start_time: datetime,
        average_speed: float = 50.0
    ) -> Tuple[List[Stop], List[LogEntry]]:
        """
        Calculate a compliant HOS schedule for a trip
        
        Args:
            trip: Trip object
            distance_miles: Total distance in miles
            start_time: When the trip starts
            average_speed: Average driving speed in mph
            
        Returns:
            Tuple of (stops, log_entries) that comply with HOS regulations
        """
        # Calculate total driving time needed
        total_driving_hours = distance_miles / average_speed
        
        # Generate the schedule
        schedule_events = self._generate_schedule_events(
            trip, total_driving_hours, start_time
        )
        
        # Convert events to Stop and LogEntry objects
        stops = self._create_stops_from_events(trip, schedule_events)
        log_entries = self._create_log_entries_from_events(trip, schedule_events)
        
        return stops, log_entries
    
    def _generate_schedule_events(
        self, 
        trip: Trip, 
        total_driving_hours: float, 
        start_time: datetime
    ) -> List[ScheduleEvent]:
        """Generate a compliant schedule of events"""
        events = []
        current_time = start_time
        remaining_driving_hours = total_driving_hours
        current_location = trip.pickup_location
        
        # Track driving hours in current duty period
        driving_hours_today = 0.0
        duty_start_time = start_time
        
        while remaining_driving_hours > 0:
            # Check if we've exceeded 14-hour duty window
            if current_time >= duty_start_time + timedelta(hours=self.constraints.max_duty_hours):
                # Need sleeper berth time
                sleeper_start = current_time
                sleeper_end = sleeper_start + timedelta(hours=self.constraints.sleeper_berth_hours)
                
                events.append(ScheduleEvent(
                    start_time=sleeper_start,
                    end_time=sleeper_end,
                    event_type='sleeper',
                    location=current_location,
                    description="10-hour sleeper berth break"
                ))
                
                current_time = sleeper_end
                driving_hours_today = 0.0
                duty_start_time = current_time
                continue
            
            # Calculate how much driving we can do today
            max_driving_today = min(
                self.constraints.max_driving_hours - driving_hours_today,
                remaining_driving_hours
            )
            
            # Check if we need a 30-minute break (after 8 hours of driving)
            if driving_hours_today >= self.constraints.break_after_driving_hours and remaining_driving_hours > 0:
                # Add 30-minute break
                break_start = current_time
                break_end = break_start + timedelta(minutes=self.constraints.break_duration_minutes)
                
                events.append(ScheduleEvent(
                    start_time=break_start,
                    end_time=break_end,
                    event_type='break',
                    location=current_location,
                    description="30-minute break after 8 hours driving"
                ))
                
                current_time = break_end
                driving_hours_today = 0.0  # Reset after break
                max_driving_today = min(
                    self.constraints.max_driving_hours,
                    remaining_driving_hours
                )
            
            # Schedule driving time in chunks to allow for breaks
            if max_driving_today > 0:
                # If we need a break, schedule driving up to 8 hours first
                if driving_hours_today == 0 and max_driving_today > self.constraints.break_after_driving_hours:
                    # Schedule 8 hours of driving first
                    driving_chunk = self.constraints.break_after_driving_hours
                else:
                    # Schedule the full amount
                    driving_chunk = max_driving_today
                
                driving_start = current_time
                driving_end = driving_start + timedelta(hours=driving_chunk)
                
                # Update location based on distance covered
                distance_covered = driving_chunk * 50.0  # Assuming 50 mph average
                if distance_covered >= remaining_driving_hours * 50.0:
                    current_location = trip.dropoff_location
                else:
                    # Estimate intermediate location
                    progress = distance_covered / (total_driving_hours * 50.0)
                    current_location = f"En route to {trip.dropoff_location} ({progress:.0%})"
                
                events.append(ScheduleEvent(
                    start_time=driving_start,
                    end_time=driving_end,
                    event_type='driving',
                    location=current_location,
                    description=f"Driving {driving_chunk:.1f} hours"
                ))
                
                current_time = driving_end
                driving_hours_today += driving_chunk
                remaining_driving_hours -= driving_chunk
            
            # If we still have driving hours but can't drive more today
            if remaining_driving_hours > 0 and driving_hours_today >= self.constraints.max_driving_hours:
                # Need to wait until next day or take sleeper berth
                if current_time < duty_start_time + timedelta(hours=self.constraints.max_duty_hours):
                    # Still in duty window, add on-duty time
                    on_duty_start = current_time
                    on_duty_end = duty_start_time + timedelta(hours=self.constraints.max_duty_hours)
                    
                    events.append(ScheduleEvent(
                        start_time=on_duty_start,
                        end_time=on_duty_end,
                        event_type='on_duty',
                        location=current_location,
                        description="On-duty, not driving"
                    ))
                    
                    current_time = on_duty_end
                
                # Add sleeper berth time
                sleeper_start = current_time
                sleeper_end = sleeper_start + timedelta(hours=self.constraints.sleeper_berth_hours)
                
                events.append(ScheduleEvent(
                    start_time=sleeper_start,
                    end_time=sleeper_end,
                    event_type='sleeper',
                    location=current_location,
                    description="10-hour sleeper berth break"
                ))
                
                current_time = sleeper_end
                driving_hours_today = 0.0
                duty_start_time = current_time
        
        return events
    
    def _create_stops_from_events(self, trip: Trip, events: List[ScheduleEvent]) -> List[Stop]:
        """Convert schedule events to Stop objects"""
        stops = []
        
        for event in events:
            if event.event_type in ['break', 'sleeper']:
                stop_type = 'rest' if event.event_type == 'break' else 'rest'
                
                stop = Stop(
                    trip=trip,
                    location=event.location,
                    type=stop_type,
                    start_time=event.start_time,
                    end_time=event.end_time
                )
                stops.append(stop)
        
        return stops
    
    def _create_log_entries_from_events(self, trip: Trip, events: List[ScheduleEvent]) -> List[LogEntry]:
        """Convert schedule events to LogEntry objects"""
        log_entries = []
        
        # Group events by day
        events_by_day = {}
        for event in events:
            day = event.start_time.date()
            if day not in events_by_day:
                events_by_day[day] = []
            events_by_day[day].append(event)
        
        # Create log entries for each day
        for day, day_events in events_by_day.items():
            # Sort events by start time
            day_events.sort(key=lambda x: x.start_time)
            
            # Group consecutive events of the same type
            current_type = None
            current_start = None
            current_end = None
            current_location = None
            
            for event in day_events:
                if event.event_type != current_type:
                    # Save previous entry if exists
                    if current_type is not None:
                        log_entry = LogEntry(
                            trip=trip,
                            day=day,
                            status=self._map_event_type_to_status(current_type),
                            start_hour=current_start.time(),
                            end_hour=current_end.time(),
                            location=current_location
                        )
                        log_entries.append(log_entry)
                    
                    # Start new entry
                    current_type = event.event_type
                    current_start = event.start_time
                    current_end = event.end_time
                    current_location = event.location
                else:
                    # Extend current entry
                    current_end = event.end_time
            
            # Save the last entry
            if current_type is not None:
                log_entry = LogEntry(
                    trip=trip,
                    day=day,
                    status=self._map_event_type_to_status(current_type),
                    start_hour=current_start.time(),
                    end_hour=current_end.time(),
                    location=current_location
                )
                log_entries.append(log_entry)
        
        return log_entries
    
    def _map_event_type_to_status(self, event_type: str) -> str:
        """Map event type to LogEntry status"""
        mapping = {
            'driving': 'driving',
            'break': 'on-duty',
            'sleeper': 'sleeper',
            'on_duty': 'on-duty'
        }
        return mapping.get(event_type, 'on-duty')
    
    def validate_70_8_rule(self, log_entries: List[LogEntry], check_date: date) -> bool:
        """
        Validate 70/8 rolling rule
        
        Args:
            log_entries: List of log entries to check
            check_date: Date to check compliance for
            
        Returns:
            True if compliant, False otherwise
        """
        # Get entries from the last 8 days (including check_date)
        start_date = check_date - timedelta(days=7)
        
        relevant_entries = [
            entry for entry in log_entries
            if start_date <= entry.day <= check_date
        ]
        
        # Calculate total hours for driving and on-duty time
        total_hours = 0.0
        for entry in relevant_entries:
            if entry.status in ['driving', 'on-duty']:
                start_time = datetime.combine(entry.day, entry.start_hour)
                end_time = datetime.combine(entry.day, entry.end_hour)
                if end_time < start_time:  # Handle overnight entries
                    end_time += timedelta(days=1)
                hours = (end_time - start_time).total_seconds() / 3600
                total_hours += hours
        
        return total_hours <= self.constraints.max_hours_8_days


def schedule_trip_hos(
    trip: Trip, 
    distance_miles: float, 
    start_time: datetime,
    average_speed: float = 50.0
) -> Tuple[List[Stop], List[LogEntry]]:
    """
    Convenience function to schedule a trip with HOS compliance
    
    Args:
        trip: Trip object
        distance_miles: Total distance in miles
        start_time: When the trip starts
        average_speed: Average driving speed in mph
        
    Returns:
        Tuple of (stops, log_entries) that comply with HOS regulations
    """
    scheduler = HOSScheduler()
    return scheduler.calculate_trip_schedule(trip, distance_miles, start_time, average_speed)


def schedule_trip_with_route(
    trip: Trip,
    start_time: datetime,
    fuel_interval_miles: float = 1000.0
) -> Tuple[Dict, List[Stop], List[LogEntry]]:
    """
    Schedule a trip with real route calculation, fuel stops, and HOS compliance
    
    Args:
        trip: Trip object with pickup_location and dropoff_location
        start_time: When the trip starts
        fuel_interval_miles: Distance interval for fuel stops
        
    Returns:
        Tuple of (route_info, stops, log_entries)
    """
    try:
        # Calculate route with fuel stops
        route_calculator = RouteCalculator()
        route_info = route_calculator.calculate_complete_route(
            trip.pickup_location,
            trip.dropoff_location,
            fuel_interval_miles
        )
        
        # Update trip with calculated distance
        trip.cycle_hours = Decimal(str(route_info['route']['driving_hours']))
        
        # Schedule with HOS compliance
        scheduler = HOSScheduler()
        stops, log_entries = scheduler.calculate_trip_schedule(
            trip,
            route_info['route']['distance_miles'],
            start_time,
            average_speed=50.0  # Default speed, could be calculated from route
        )
        
        # Add route-specific stops (fuel, pickup, dropoff)
        route_stops = _create_route_stops(trip, route_info, start_time)
        
        # Combine HOS stops with route stops
        all_stops = stops + route_stops
        
        return route_info, all_stops, log_entries
        
    except Exception as e:
        raise ValueError(f"Route-based trip scheduling failed: {str(e)}")


def _create_route_stops(trip: Trip, route_info: Dict, start_time: datetime) -> List[Stop]:
    """
    Create Stop objects for route waypoints (fuel, pickup, dropoff)
    
    Args:
        trip: Trip object
        route_info: Route information from route calculator
        start_time: Trip start time
        
    Returns:
        List of Stop objects
    """
    stops = []
    current_time = start_time
    
    for waypoint in route_info['waypoints']:
        if waypoint['type'] in ['pickup_stop', 'dropoff_stop']:
            # 1-hour stops for pickup/dropoff
            stop = Stop(
                trip=trip,
                location=waypoint['name'],
                type='pickup' if waypoint['type'] == 'pickup_stop' else 'dropoff',
                start_time=current_time,
                end_time=current_time + timedelta(hours=1)
            )
            stops.append(stop)
            current_time += timedelta(hours=1)
            
        elif waypoint['type'] == 'fuel':
            # 30-minute fuel stops
            stop = Stop(
                trip=trip,
                location=waypoint['name'],
                type='fuel',
                start_time=current_time,
                end_time=current_time + timedelta(minutes=30)
            )
            stops.append(stop)
            current_time += timedelta(minutes=30)
    
    return stops


# Example usage and testing
if __name__ == "__main__":
    # Create a sample trip
    from datetime import datetime
    
    trip = Trip(
        current_location="New York, NY",
        pickup_location="New York, NY", 
        dropoff_location="Los Angeles, CA",
        cycle_hours=Decimal('0.00')
    )
    
    # Schedule a 2800-mile trip (NY to LA)
    distance = 2800.0
    start_time = datetime(2024, 1, 1, 6, 0)  # 6 AM start
    
    stops, log_entries = schedule_trip_hos(trip, distance, start_time)
    
    print(f"Scheduled {len(stops)} stops and {len(log_entries)} log entries")
    print(f"Trip duration: {(log_entries[-1].day - log_entries[0].day).days + 1} days")
