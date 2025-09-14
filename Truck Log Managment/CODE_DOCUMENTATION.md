# Truck Log Management System - Code Documentation

## Overview
This is a comprehensive Django-based truck log management system that implements DOT Hours of Service (HOS) regulations for commercial truck drivers. The system includes route calculation, trip scheduling, and compliance tracking.

## Architecture
- **Backend**: Django REST Framework with SQLite database
- **Frontend**: React with Vite, Tailwind CSS
- **Route Service**: OSRM (Open Source Routing Machine) integration
- **HOS Compliance**: Custom implementation of DOT regulations

---

## Models

### 1. Trip Model (`core/models.py`)
**Purpose**: Represents a truck trip from pickup to dropoff location.

**Fields**:
- `id`: Primary key (auto-generated)
- `current_location`: CharField(255) - Current location of the truck
- `pickup_location`: CharField(255) - Location where the trip started
- `dropoff_location`: CharField(255) - Final destination of the trip
- `cycle_hours`: DecimalField(5,2) - Total cycle hours for this trip
- `created_at`: DateTimeField - When this trip was created (auto-generated)

**Methods**:
- `__str__()`: Returns formatted string "Trip {id}: {pickup} to {dropoff}"

**Meta Configuration**:
- Ordering: `['-created_at']` (newest first)
- Verbose names for admin interface

### 2. Stop Model (`core/models.py`)
**Purpose**: Represents stops during a trip (pickup, dropoff, fuel, rest).

**Fields**:
- `id`: Primary key (auto-generated)
- `trip`: ForeignKey to Trip - The trip this stop belongs to
- `location`: CharField(255) - Location of the stop
- `type`: CharField(10) - Type of stop with choices:
  - `'pickup'`: Pickup stop
  - `'dropoff'`: Dropoff stop
  - `'fuel'`: Fuel stop
  - `'rest'`: Rest stop
- `start_time`: DateTimeField - When the stop started
- `end_time`: DateTimeField - When the stop ended (nullable)

**Methods**:
- `__str__()`: Returns formatted string "{type} at {location}"

**Meta Configuration**:
- Ordering: `['start_time']` (chronological)
- Related name: `'stops'` for reverse relationship

### 3. LogEntry Model (`core/models.py`)
**Purpose**: Represents daily log entries for HOS compliance tracking.

**Fields**:
- `id`: Primary key (auto-generated)
- `trip`: ForeignKey to Trip - The trip this log entry belongs to
- `day`: DateField - Date of the log entry
- `status`: CharField(10) - Status during this period with choices:
  - `'off'`: Off duty
  - `'sleeper'`: Sleeper berth
  - `'driving'`: Driving
  - `'on-duty'`: On duty but not driving
- `start_hour`: TimeField - Start time of this status period
- `end_hour`: TimeField - End time of this status period
- `location`: CharField(255) - Location during this period

**Methods**:
- `__str__()`: Returns formatted string with trip, day, status, and time

**Meta Configuration**:
- Ordering: `['day', 'start_hour']` (chronological)
- Unique constraint: `['trip', 'day', 'start_hour']` (prevents overlapping entries)

---

## Views and API Endpoints

### 1. Trip Management (`core/views.py`)

#### `trips(request)` - GET/POST
**Purpose**: List all trips or create a new trip with HOS scheduling.

**GET Method**:
- Returns all trips using `TripSerializer`
- Uses `cors_response()` for CORS headers

**POST Method**:
- Creates a new trip with HOS compliance
- Calculates route and schedules stops/log entries
- Returns comprehensive trip data including route, stops, and log entries

**Parameters** (POST):
- `pickup_location`: Starting location
- `dropoff_location`: Ending location
- `current_location`: Current location (optional, defaults to pickup)
- `start_time`: Trip start time (optional, defaults to now)
- `fuel_interval_miles`: Distance interval for fuel stops (default: 1000.0)

#### `trip_detail(request, trip_id)` - GET
**Purpose**: Fetch detailed trip information including stops and log sheets.

**Returns**:
- Trip details
- Route information with geometry
- Stops grouped by type
- Daily log sheets with HOS compliance data
- Summary statistics

#### `calculate_route_api(request)` - POST
**Purpose**: Calculate route between two locations with fuel stops.

**Parameters**:
- `start_location`: Starting location
- `end_location`: Ending location
- `fuel_interval_miles`: Distance interval for fuel stops

### 2. CORS and Utility Functions

#### `add_cors_headers(response)`
**Purpose**: Add CORS headers to HTTP responses.

**Headers Added**:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`
- `Access-Control-Allow-Credentials: true`

#### `cors_response(data, status=200)`
**Purpose**: Create a JsonResponse with CORS headers.

#### `cors_options(request)`
**Purpose**: Handle CORS preflight requests.

#### `test_cors(request)` / `test_middleware(request)`
**Purpose**: Test CORS functionality.

---

## Hours of Service (HOS) System

### 1. HOSConstraints Class (`core/hos.py`)
**Purpose**: Defines DOT HOS regulation constraints.

**Properties**:
- `max_driving_hours`: 11 hours per day
- `max_duty_hours`: 14 hours duty window
- `break_after_driving_hours`: 8 hours (requires 30-min break)
- `break_duration_minutes`: 30 minutes
- `sleeper_berth_hours`: 10 hours required
- `max_hours_8_days`: 70 hours in 8 days
- `max_hours_7_days`: 60 hours in 7 days

### 2. ScheduleEvent Class (`core/hos.py`)
**Purpose**: Represents a scheduled event in the HOS timeline.

**Properties**:
- `start_time`: Event start time
- `end_time`: Event end time
- `event_type`: Type of event ('driving', 'break', 'sleeper', 'on_duty')
- `location`: Event location
- `description`: Event description

### 3. HOSScheduler Class (`core/hos.py`)
**Purpose**: Main HOS compliance scheduler.

#### `calculate_trip_schedule(trip, distance_miles, start_time, average_speed=50.0)`
**Purpose**: Calculate a compliant HOS schedule for a trip.

**Process**:
1. Calculate total driving time needed
2. Generate schedule events with HOS compliance
3. Convert events to Stop and LogEntry objects

**Returns**: Tuple of (stops, log_entries)

#### `_generate_schedule_events(trip, total_driving_hours, start_time)`
**Purpose**: Generate a compliant schedule of events.

**Logic**:
- Tracks 14-hour duty window
- Enforces 11-hour driving limit
- Adds 30-minute breaks after 8 hours driving
- Requires 10-hour sleeper berth breaks
- Handles overnight scheduling

#### `_create_stops_from_events(trip, events)`
**Purpose**: Convert schedule events to Stop objects.

#### `_create_log_entries_from_events(trip, events)`
**Purpose**: Convert schedule events to LogEntry objects.

**Process**:
- Groups events by day
- Combines consecutive events of same type
- Maps event types to LogEntry statuses

#### `validate_70_8_rule(log_entries, check_date)`
**Purpose**: Validate 70/8 rolling rule compliance.

**Logic**: Checks if total hours in 8-day period ≤ 70 hours

### 4. Convenience Functions

#### `schedule_trip_hos(trip, distance_miles, start_time, average_speed=50.0)`
**Purpose**: Convenience function to schedule a trip with HOS compliance.

#### `schedule_trip_with_route(trip, start_time, fuel_interval_miles=1000.0)`
**Purpose**: Schedule a trip with real route calculation, fuel stops, and HOS compliance.

**Process**:
1. Calculate route with fuel stops using RouteCalculator
2. Update trip with calculated distance
3. Schedule with HOS compliance
4. Add route-specific stops (fuel, pickup, dropoff)
5. Combine HOS stops with route stops

---

## Route Service

### 1. RoutePoint Class (`core/route_service.py`)
**Purpose**: Represents a point on the route.

**Properties**:
- `latitude`: Point latitude
- `longitude`: Point longitude
- `name`: Point name
- `type`: Point type ('pickup', 'dropoff', 'fuel', 'waypoint')

### 2. RouteInfo Class (`core/route_service.py`)
**Purpose**: Route information including distance, duration, and waypoints.

**Properties**:
- `distance_miles`: Total distance in miles
- `duration_hours`: Total duration in hours
- `waypoints`: List of RoutePoint objects
- `route_geometry`: Optional route geometry coordinates

### 3. OSRMRouteService Class (`core/route_service.py`)
**Purpose**: Service for calculating routes using OSRM API.

#### `geocode_location(location)`
**Purpose**: Geocode a location string to coordinates using Nominatim.

**Process**:
1. Query Nominatim API with location string
2. Parse response for latitude/longitude
3. Return coordinates tuple

#### `calculate_route(start_location, end_location)`
**Purpose**: Calculate route between two locations using OSRM.

**Process**:
1. Geocode both locations
2. Query OSRM API for route
3. Parse route data for distance, duration, geometry
4. Create RoutePoint objects for start/end
5. Return RouteInfo object

#### `add_fuel_stops(route_info, fuel_interval_miles=1000.0)`
**Purpose**: Add fuel stops along the route every specified interval.

**Logic**:
- Calculates number of fuel stops needed
- Estimates positions using linear interpolation
- Creates RoutePoint objects for fuel stops

#### `add_pickup_dropoff_stops(route_info)`
**Purpose**: Add pickup and dropoff stops with 1-hour duration each.

### 4. RouteCalculator Class (`core/route_service.py`)
**Purpose**: Main route calculator that combines OSRM with HOS scheduling.

#### `calculate_complete_route(start_location, end_location, fuel_interval_miles=1000.0)`
**Purpose**: Calculate complete route with fuel stops, pickup/dropoff stops, and HOS scheduling.

**Process**:
1. Calculate base route using OSRM
2. Add fuel stops at specified intervals
3. Add pickup/dropoff stops
4. Calculate additional time for stops
5. Return comprehensive route information

### 5. Convenience Function

#### `calculate_route(start_location, end_location, fuel_interval_miles=1000.0)`
**Purpose**: Calculate route between two locations with fuel stops.

---

## Serializers

### 1. TripSerializer (`core/serializers.py`)
**Purpose**: Serialize Trip model for API responses.

**Fields**: `['id', 'current_location', 'pickup_location', 'dropoff_location', 'cycle_hours', 'created_at']`

### 2. StopSerializer (`core/serializers.py`)
**Purpose**: Serialize Stop model for API responses.

**Fields**: `['id', 'trip', 'location', 'type', 'start_time', 'end_time']`

### 3. LogEntrySerializer (`core/serializers.py`)
**Purpose**: Serialize LogEntry model for API responses.

**Fields**: `['id', 'trip', 'day', 'status', 'start_hour', 'end_hour', 'location']`

---

## Middleware

### CORSMiddleware (`core/middleware.py`)
**Purpose**: Custom middleware for CORS headers.

**Process**:
1. Handles preflight OPTIONS requests
2. Adds CORS headers to all responses
3. Allows all origins, methods, and headers for development

---

## URL Configuration

### Core URLs (`core/urls.py`)
**Patterns**:
- `trips/` - Trip management (GET/POST)
- `trips/<int:trip_id>/` - Trip details (GET)
- `routes/calculate/` - Route calculation (POST)
- `test-cors/` - CORS testing (GET)
- `test-middleware/` - Middleware testing (GET)
- `cors-options/` - CORS preflight (OPTIONS)

---

## Settings Configuration

### Database
- **Engine**: SQLite3
- **File**: `db.sqlite3`

### Installed Apps
- Django core apps
- `rest_framework` - API framework
- `corsheaders` - CORS handling
- `core` - Main application

### CORS Settings
- **Allowed Origins**: `http://localhost:5173`, `http://127.0.0.1:5173`
- **Allow All Origins**: `True` (development only)
- **Allow Credentials**: `True`
- **Allowed Headers**: Comprehensive list for API requests

### REST Framework Settings
- **Permissions**: `AllowAny` (no authentication required)
- **Renderers**: JSON only
- **Parsers**: JSON only

---

## Frontend Components

### 1. DailyLogSheet Component
**Purpose**: Displays HOS-compliant log entries for a specific day.

**Features**:
- 24-hour timeline grid
- Duty status visualization
- Time block interactions
- PDF export functionality
- Responsive design

### 2. RouteMap Component
**Purpose**: Displays interactive map with route and stops.

**Features**:
- Leaflet map integration
- Route visualization
- Stop markers
- Interactive popups

### 3. TripForm Component
**Purpose**: Form for creating new trips.

**Features**:
- Location input validation
- Start time selection
- Fuel interval configuration
- Real-time route calculation

### 4. TripCard Component
**Purpose**: Displays trip summary information.

**Features**:
- Trip details display
- Status indicators
- Action buttons
- Responsive layout

---

## Key Features

### 1. HOS Compliance
- **11-hour driving limit** per day
- **14-hour duty window** enforcement
- **30-minute break** after 8 hours driving
- **10-hour sleeper berth** requirement
- **70/8 rolling rule** validation

### 2. Route Calculation
- **Real-time routing** using OSRM
- **Fuel stop planning** at configurable intervals
- **Pickup/dropoff stops** with duration
- **Distance and duration** calculations

### 3. Trip Management
- **Complete trip lifecycle** management
- **Stop scheduling** and tracking
- **Log entry generation** for compliance
- **PDF export** functionality

### 4. API Integration
- **RESTful API** design
- **CORS support** for frontend integration
- **JSON serialization** for all data
- **Error handling** and validation

---

## Usage Examples

### Creating a Trip
```python
# POST /api/trips/
{
    "pickup_location": "New York, NY",
    "dropoff_location": "Los Angeles, CA",
    "start_time": "2024-01-01T06:00:00Z",
    "fuel_interval_miles": 1000.0
}
```

### Calculating a Route
```python
# POST /api/routes/calculate/
{
    "start_location": "New York, NY",
    "end_location": "Los Angeles, CA",
    "fuel_interval_miles": 1000.0
}
```

### Getting Trip Details
```python
# GET /api/trips/1/
# Returns comprehensive trip data including route, stops, and log entries
```

---

## Dependencies

### Backend
- Django 5.2.6
- Django REST Framework
- django-cors-headers
- requests (for OSRM integration)

### Frontend
- React 18
- Vite
- Tailwind CSS
- Leaflet (for maps)
- React Router

---

## File Structure
```
Truck Log Management/
├── core/                    # Main Django app
│   ├── models.py           # Database models
│   ├── views.py            # API views
│   ├── hos.py              # HOS compliance logic
│   ├── route_service.py    # Route calculation
│   ├── serializers.py      # API serializers
│   ├── middleware.py       # CORS middleware
│   └── urls.py             # URL patterns
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── services/       # API services
│   └── dist/               # Built frontend
├── triplogs/               # Django project settings
└── templates/              # Static file serving
```

This documentation provides a comprehensive overview of all methods, models, and functionality in the Truck Log Management system.
