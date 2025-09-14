"""
API views for the core app
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from datetime import datetime
from decimal import Decimal

from .models import Trip, Stop, LogEntry
from .hos import schedule_trip_hos, schedule_trip_with_route
from .serializers import TripSerializer, StopSerializer, LogEntrySerializer
from .route_service import calculate_route


def add_cors_headers(response):
    """Add CORS headers to response"""
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    response["Access-Control-Allow-Credentials"] = "true"
    return response

def cors_response(data, status=200):
    """Create a JsonResponse with CORS headers"""
    response = JsonResponse(data, status=status, safe=False)
    return add_cors_headers(response)

def test_cors(request):
    """Test CORS headers"""
    return cors_response({'message': 'CORS test successful', 'origin': request.META.get('HTTP_ORIGIN', 'No origin')})

def test_middleware(request):
    """Test middleware CORS headers"""
    from django.http import JsonResponse
    return JsonResponse({'message': 'Middleware test', 'origin': request.META.get('HTTP_ORIGIN', 'No origin')})

def cors_options(request):
    """Handle CORS preflight requests"""
    from django.http import JsonResponse
    response = JsonResponse({})
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Origin, Accept"
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Max-Age"] = "86400"
    return response


@api_view(['GET'])
def trip_detail(request, trip_id):
    """Fetch trip details, stops, and log sheets"""
    trip = get_object_or_404(Trip, id=trip_id)
    
    stops = Stop.objects.filter(trip=trip).order_by('start_time')
    log_entries = LogEntry.objects.filter(trip=trip).order_by('day', 'start_hour')
    
    # Calculate trip statistics
    total_driving_hours = sum(
        (datetime.combine(entry.day, entry.end_hour) - datetime.combine(entry.day, entry.start_hour)).total_seconds() / 3600
        for entry in log_entries if entry.status == 'driving'
    )
    
    # Group log entries by day for log sheets
    log_sheets = {}
    for entry in log_entries:
        day = entry.day
        if day not in log_sheets:
            log_sheets[day] = []
        log_sheets[day].append(entry)
    
    # Convert to list of daily log sheets
    daily_log_sheets = []
    for day in sorted(log_sheets.keys()):
        day_entries = sorted(log_sheets[day], key=lambda x: x.start_hour)
        daily_driving_hours = sum(
            (datetime.combine(e.day, e.end_hour) - datetime.combine(e.day, e.start_hour)).total_seconds() / 3600
            for e in day_entries if e.status == 'driving'
        )
        daily_on_duty_hours = sum(
            (datetime.combine(e.day, e.end_hour) - datetime.combine(e.day, e.start_hour)).total_seconds() / 3600
            for e in day_entries if e.status in ['driving', 'on-duty']
        )
        
        daily_log_sheets.append({
            'date': day.strftime('%Y-%m-%d'),
            'day_name': day.strftime('%A'),
            'entries': LogEntrySerializer(day_entries, many=True).data,
            'driving_hours': round(daily_driving_hours, 1),
            'on_duty_hours': round(daily_on_duty_hours, 1),
            'total_entries': len(day_entries)
        })
    
    # Group stops by type
    stops_by_type = {}
    for stop in stops:
        stop_type = stop.type
        if stop_type not in stops_by_type:
            stops_by_type[stop_type] = []
        stops_by_type[stop_type].append(StopSerializer(stop).data)
    
    # Get route information for the map
    try:
        from .route_service import calculate_route
        route_info = calculate_route(trip.pickup_location, trip.dropoff_location, 1000.0)
    except Exception as e:
        # Fallback route info if calculation fails
        route_info = {
            'route': {
                'distance_miles': 0,
                'duration_hours': 0,
                'driving_hours': 0,
                'route_geometry': []
            },
            'waypoints': []
        }
    
    trip_serializer = TripSerializer(trip)
    
    response = Response({
        'trip': trip_serializer.data,
        'route': {
            **route_info['route'],
            'route_geometry': route_info.get('route_geometry', [])
        },
        'waypoints': route_info['waypoints'],
        'stops': {
            'all': StopSerializer(stops, many=True).data,
            'by_type': stops_by_type,
            'total_count': len(stops)
        },
        'log_sheets': {
            'daily': daily_log_sheets,
            'total_days': len(daily_log_sheets),
            'total_driving_hours': round(total_driving_hours, 1),
            'total_entries': len(log_entries)
        },
        'summary': {
            'trip_duration_days': len(daily_log_sheets),
            'total_stops': len(stops),
            'total_log_entries': len(log_entries),
            'total_driving_hours': round(total_driving_hours, 1),
            'pickup_location': trip.pickup_location,
            'dropoff_location': trip.dropoff_location,
            'created_at': trip.created_at,
            'route_distance_miles': route_info['route']['distance_miles'],
            'route_duration_hours': route_info['route']['duration_hours']
        }
    })
    return add_cors_headers(response)


@api_view(['POST'])
def calculate_route_api(request):
    """
    Calculate route between two locations with fuel stops
    
    Expected payload:
    {
        "start_location": "New York, NY",
        "end_location": "Los Angeles, CA",
        "fuel_interval_miles": 1000.0
    }
    """
    try:
        start_location = request.data.get('start_location')
        end_location = request.data.get('end_location')
        fuel_interval_miles = float(request.data.get('fuel_interval_miles', 1000.0))
        
        if not start_location or not end_location:
            response = Response(
                {'error': 'start_location and end_location are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            return add_cors_headers(response)
        
        # Calculate route
        route_info = calculate_route(start_location, end_location, fuel_interval_miles)
        
        response = Response(route_info, status=status.HTTP_200_OK)
        return add_cors_headers(response)
        
    except Exception as e:
        response = Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        return add_cors_headers(response)


@api_view(['GET', 'POST'])
def trips(request):
    """
    GET: List all trips
    POST: Create trip with HOS + routing, return logs & stops
    """
    if request.method == 'GET':
        # List all trips
        trips = Trip.objects.all()
        serializer = TripSerializer(trips, many=True)
        return cors_response(serializer.data)
    
    elif request.method == 'POST':
        # Create trip with HOS + routing
        try:
            # Create trip
            trip_data = {
                'pickup_location': request.data.get('pickup_location'),
                'dropoff_location': request.data.get('dropoff_location'),
                'current_location': request.data.get('current_location', request.data.get('pickup_location')),
                'cycle_hours': Decimal('0.00')
            }
            
            trip = Trip.objects.create(**trip_data)
            
            # Get scheduling parameters
            start_time_str = request.data.get('start_time')
            fuel_interval_miles = float(request.data.get('fuel_interval_miles', 1000.0))
            
            if start_time_str:
                start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            else:
                start_time = datetime.now()
            
            # Schedule the trip with route calculation
            route_info, stops, log_entries = schedule_trip_with_route(
                trip, start_time, fuel_interval_miles
            )
            
            # Save stops and log entries to database
            for stop in stops:
                stop.save()
            
            for log_entry in log_entries:
                log_entry.save()
            
            # Serialize results
            trip_serializer = TripSerializer(trip)
            stops_serializer = StopSerializer(stops, many=True)
            log_entries_serializer = LogEntrySerializer(log_entries, many=True)
            
            response = Response({
                'trip': trip_serializer.data,
                'route': route_info['route'],
                'waypoints': route_info['waypoints'],
                'stops': stops_serializer.data,
                'log_entries': log_entries_serializer.data,
                'summary': {
                    'total_stops': len(stops),
                    'total_log_entries': len(log_entries),
                    'trip_duration_days': (max(entry.day for entry in log_entries) - min(entry.day for entry in log_entries)).days + 1 if log_entries else 0,
                    'total_driving_hours': sum(
                        (datetime.combine(entry.day, entry.end_hour) - datetime.combine(entry.day, entry.start_hour)).total_seconds() / 3600
                        for entry in log_entries if entry.status == 'driving'
                    ),
                    'route_distance_miles': route_info['route']['distance_miles'],
                    'route_duration_hours': route_info['route']['duration_hours']
                }
            }, status=status.HTTP_201_CREATED)
            return add_cors_headers(response)
            
        except Exception as e:
            response = Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            return add_cors_headers(response)