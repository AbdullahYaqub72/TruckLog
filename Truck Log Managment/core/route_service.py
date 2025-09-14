"""
Route calculation service using OSRM (Open Source Routing Machine)
Provides real-time route calculation, distance, and duration
"""

import requests
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from decimal import Decimal
import math


@dataclass
class RoutePoint:
    """Represents a point on the route"""
    latitude: float
    longitude: float
    name: str
    type: str  # 'pickup', 'dropoff', 'fuel', 'waypoint'


@dataclass
class RouteInfo:
    """Route information including distance, duration, and waypoints"""
    distance_miles: float
    duration_hours: float
    waypoints: List[RoutePoint]
    route_geometry: Optional[List[Tuple[float, float]]] = None


class OSRMRouteService:
    """Service for calculating routes using OSRM API"""
    
    def __init__(self, base_url: str = "http://router.project-osrm.org"):
        self.base_url = base_url.rstrip('/')
    
    def geocode_location(self, location: str) -> Tuple[float, float]:
        """
        Geocode a location string to coordinates using Nominatim (OpenStreetMap)
        
        Args:
            location: Location string (e.g., "New York, NY")
            
        Returns:
            Tuple of (latitude, longitude)
        """
        try:
            # Use Nominatim for geocoding
            nominatim_url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': location,
                'format': 'json',
                'limit': 1,
                'addressdetails': 1
            }
            headers = {
                'User-Agent': 'TruckLogManagement/1.0'
            }
            
            response = requests.get(nominatim_url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if not data:
                raise ValueError(f"Location not found: {location}")
            
            lat = float(data[0]['lat'])
            lon = float(data[0]['lon'])
            
            return lat, lon
            
        except Exception as e:
            raise ValueError(f"Failed to geocode location '{location}': {str(e)}")
    
    def calculate_route(self, start_location: str, end_location: str) -> RouteInfo:
        """
        Calculate route between two locations
        
        Args:
            start_location: Starting location
            end_location: Ending location
            
        Returns:
            RouteInfo with distance, duration, and waypoints
        """
        try:
            # Geocode locations
            start_lat, start_lon = self.geocode_location(start_location)
            end_lat, end_lon = self.geocode_location(end_location)
            
            # OSRM route request
            coordinates = f"{start_lon},{start_lat};{end_lon},{end_lat}"
            url = f"{self.base_url}/route/v1/driving/{coordinates}"
            
            params = {
                'overview': 'full',
                'geometries': 'geojson',
                'steps': 'true'
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if data['code'] != 'Ok':
                raise ValueError(f"OSRM routing failed: {data.get('message', 'Unknown error')}")
            
            route = data['routes'][0]
            legs = data['waypoints']
            
            # Extract route information
            distance_meters = route['distance']
            duration_seconds = route['duration']
            
            # Convert to miles and hours
            distance_miles = distance_meters * 0.000621371
            duration_hours = duration_seconds / 3600
            
            # Create waypoints
            waypoints = [
                RoutePoint(
                    latitude=legs[0]['location'][1],
                    longitude=legs[0]['location'][0],
                    name=start_location,
                    type='pickup'
                ),
                RoutePoint(
                    latitude=legs[1]['location'][1],
                    longitude=legs[1]['location'][0],
                    name=end_location,
                    type='dropoff'
                )
            ]
            
            # Extract route geometry
            route_geometry = []
            if 'geometry' in route and route['geometry']['type'] == 'LineString':
                route_geometry = route['geometry']['coordinates']
            
            return RouteInfo(
                distance_miles=distance_miles,
                duration_hours=duration_hours,
                waypoints=waypoints,
                route_geometry=route_geometry
            )
            
        except Exception as e:
            raise ValueError(f"Route calculation failed: {str(e)}")
    
    def add_fuel_stops(self, route_info: RouteInfo, fuel_interval_miles: float = 1000.0) -> RouteInfo:
        """
        Add fuel stops along the route every specified interval
        
        Args:
            route_info: Original route information
            fuel_interval_miles: Distance interval for fuel stops
            
        Returns:
            Updated RouteInfo with fuel stops
        """
        if route_info.distance_miles <= fuel_interval_miles:
            return route_info
        
        # Calculate number of fuel stops needed
        num_fuel_stops = int(route_info.distance_miles // fuel_interval_miles)
        
        # Create new waypoints with fuel stops
        new_waypoints = [route_info.waypoints[0]]  # Start with pickup
        
        for i in range(1, num_fuel_stops + 1):
            # Calculate approximate position for fuel stop
            progress = (i * fuel_interval_miles) / route_info.distance_miles
            progress = min(progress, 0.95)  # Don't go too close to the end
            
            # Estimate coordinates (simplified linear interpolation)
            start_lat, start_lon = route_info.waypoints[0].latitude, route_info.waypoints[0].longitude
            end_lat, end_lon = route_info.waypoints[-1].latitude, route_info.waypoints[-1].longitude
            
            fuel_lat = start_lat + (end_lat - start_lat) * progress
            fuel_lon = start_lon + (end_lon - start_lon) * progress
            
            # Add fuel stop
            fuel_stop = RoutePoint(
                latitude=fuel_lat,
                longitude=fuel_lon,
                name=f"Fuel Stop {i}",
                type='fuel'
            )
            new_waypoints.append(fuel_stop)
        
        # Add final dropoff
        new_waypoints.append(route_info.waypoints[-1])
        
        return RouteInfo(
            distance_miles=route_info.distance_miles,
            duration_hours=route_info.duration_hours,
            waypoints=new_waypoints,
            route_geometry=route_info.route_geometry
        )
    
    def add_pickup_dropoff_stops(self, route_info: RouteInfo) -> RouteInfo:
        """
        Add pickup and dropoff stops with 1-hour duration each
        
        Args:
            route_info: Route information
            
        Returns:
            Updated RouteInfo with pickup/dropoff stops
        """
        new_waypoints = []
        
        for i, waypoint in enumerate(route_info.waypoints):
            new_waypoints.append(waypoint)
            
            # Add pickup stop after pickup waypoint
            if waypoint.type == 'pickup':
                pickup_stop = RoutePoint(
                    latitude=waypoint.latitude,
                    longitude=waypoint.longitude,
                    name=f"Pickup Stop - {waypoint.name}",
                    type='pickup_stop'
                )
                new_waypoints.append(pickup_stop)
            
            # Add dropoff stop before dropoff waypoint
            elif waypoint.type == 'dropoff':
                dropoff_stop = RoutePoint(
                    latitude=waypoint.latitude,
                    longitude=waypoint.longitude,
                    name=f"Dropoff Stop - {waypoint.name}",
                    type='dropoff_stop'
                )
                # Insert before the dropoff waypoint
                new_waypoints.insert(-1, dropoff_stop)
        
        return RouteInfo(
            distance_miles=route_info.distance_miles,
            duration_hours=route_info.duration_hours,
            waypoints=new_waypoints,
            route_geometry=route_info.route_geometry
        )


class RouteCalculator:
    """Main route calculator that combines OSRM with HOS scheduling"""
    
    def __init__(self):
        self.osrm_service = OSRMRouteService()
    
    def calculate_complete_route(
        self, 
        start_location: str, 
        end_location: str,
        fuel_interval_miles: float = 1000.0
    ) -> Dict:
        """
        Calculate complete route with fuel stops, pickup/dropoff stops, and HOS scheduling
        
        Args:
            start_location: Starting location
            end_location: Ending location
            fuel_interval_miles: Distance interval for fuel stops
            
        Returns:
            Dictionary with route information and stops
        """
        try:
            # Calculate base route
            route_info = self.osrm_service.calculate_route(start_location, end_location)
            
            # Add fuel stops
            route_info = self.osrm_service.add_fuel_stops(route_info, fuel_interval_miles)
            
            # Add pickup/dropoff stops
            route_info = self.osrm_service.add_pickup_dropoff_stops(route_info)
            
            # Calculate additional time for stops
            additional_hours = 0
            for waypoint in route_info.waypoints:
                if waypoint.type in ['pickup_stop', 'dropoff_stop']:
                    additional_hours += 1.0  # 1 hour for pickup/dropoff stops
                elif waypoint.type == 'fuel':
                    additional_hours += 0.5  # 30 minutes for fuel stops
            
            # Update total duration
            total_duration_hours = route_info.duration_hours + additional_hours
            
            return {
                'route': {
                    'distance_miles': round(route_info.distance_miles, 2),
                    'duration_hours': round(total_duration_hours, 2),
                    'driving_hours': round(route_info.duration_hours, 2),
                    'stops_hours': round(additional_hours, 2)
                },
                'waypoints': [
                    {
                        'name': wp.name,
                        'type': wp.type,
                        'coords': [wp.longitude, wp.latitude]  # [lng, lat] format for Leaflet
                    }
                    for wp in route_info.waypoints
                ],
                'route_geometry': route_info.route_geometry
            }
            
        except Exception as e:
            raise ValueError(f"Complete route calculation failed: {str(e)}")


# Convenience function
def calculate_route(start_location: str, end_location: str, fuel_interval_miles: float = 1000.0) -> Dict:
    """
    Calculate route between two locations with fuel stops
    
    Args:
        start_location: Starting location
        end_location: Ending location
        fuel_interval_miles: Distance interval for fuel stops
        
    Returns:
        Dictionary with route information
    """
    calculator = RouteCalculator()
    return calculator.calculate_complete_route(start_location, end_location, fuel_interval_miles)


# Example usage and testing
if __name__ == "__main__":
    # Test the route service
    try:
        result = calculate_route("New York, NY", "Los Angeles, CA", 1000.0)
        print("Route calculation successful!")
        print(f"Distance: {result['route']['distance_miles']} miles")
        print(f"Duration: {result['route']['duration_hours']} hours")
        print(f"Waypoints: {len(result['waypoints'])}")
        
        for wp in result['waypoints']:
            print(f"  - {wp['name']} ({wp['type']})")
            
    except Exception as e:
        print(f"Error: {e}")
