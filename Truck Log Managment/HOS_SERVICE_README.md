# Hours of Service (HOS) Scheduling Service

A comprehensive Django service that implements DOT Hours of Service regulations for commercial truck drivers, including automatic scheduling of driving time, breaks, and sleeper berth periods.

## Features

### ✅ DOT Compliance
- **11-hour daily driving limit** - Enforces maximum 11 hours of driving per day
- **14-hour duty window** - Tracks total on-duty time including driving and non-driving activities
- **30-minute break requirement** - Automatically schedules 30-minute break after 8 hours of driving
- **10-hour sleeper berth** - Enforces 10-hour consecutive sleeper berth period
- **70/8 rolling rule** - Validates 70-hour limit over 8 consecutive days

### ✅ Smart Scheduling
- **Distance-based calculation** - Takes trip distance and average speed to calculate total driving time
- **Automatic break insertion** - Intelligently inserts breaks and sleeper periods
- **Multi-day trip support** - Handles long trips spanning multiple days
- **Location tracking** - Estimates intermediate locations based on progress

### ✅ API Integration
- **REST API endpoints** - Full REST API for trip scheduling and management
- **Django admin integration** - Manage trips, stops, and log entries through Django admin
- **JSON serialization** - Complete data serialization for API responses

## Usage

### Python Service

```python
from core.hos import schedule_trip_hos
from core.models import Trip
from datetime import datetime

# Create a trip
trip = Trip.objects.create(
    pickup_location="New York, NY",
    dropoff_location="Los Angeles, CA",
    current_location="New York, NY",
    cycle_hours=Decimal('0.00')
)

# Schedule with HOS compliance
stops, log_entries = schedule_trip_hos(
    trip=trip,
    distance_miles=2800.0,
    start_time=datetime(2024, 1, 1, 6, 0),
    average_speed=50.0
)
```

### REST API

#### Schedule a Trip
```bash
curl -X POST http://127.0.0.1:8000/api/trips/schedule/ \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_location": "New York, NY",
    "dropoff_location": "Atlanta, GA",
    "current_location": "New York, NY",
    "distance_miles": 500.0,
    "start_time": "2024-01-01T06:00:00Z",
    "average_speed": 50.0
  }'
```

#### List Trips
```bash
curl http://127.0.0.1:8000/api/trips/
```

#### Get Trip Details
```bash
curl http://127.0.0.1:8000/api/trips/{trip_id}/
```

## API Endpoints

- `GET /api/trips/` - List all trips
- `POST /api/trips/schedule/` - Schedule a new trip with HOS compliance
- `GET /api/trips/{id}/` - Get trip details with stops and log entries

## Models

### Trip
- `id` - Auto-generated primary key
- `current_location` - Current location of the truck
- `pickup_location` - Trip origin
- `dropoff_location` - Trip destination
- `cycle_hours` - Total cycle hours
- `created_at` - Creation timestamp

### Stop
- `id` - Auto-generated primary key
- `trip` - Foreign key to Trip
- `location` - Stop location
- `type` - Stop type (pickup/dropoff/fuel/rest)
- `start_time` - Stop start time
- `end_time` - Stop end time

### LogEntry
- `id` - Auto-generated primary key
- `trip` - Foreign key to Trip
- `day` - Date of the log entry
- `status` - Status (off/sleeper/driving/on-duty)
- `start_hour` - Start time
- `end_hour` - End time
- `location` - Location during this period

## Examples

### Short Trip (No Break Required)
- **Route**: Chicago, IL → Detroit, MI
- **Distance**: 300 miles
- **Duration**: 6 hours driving
- **Result**: Single driving period, no breaks needed

### Medium Trip (30-minute Break Required)
- **Route**: New York, NY → Atlanta, GA
- **Distance**: 500 miles
- **Duration**: 10 hours driving
- **Result**: 8 hours driving → 30-minute break → 2 hours driving

### Long Trip (Multiple Days)
- **Route**: New York, NY → Los Angeles, CA
- **Distance**: 2800 miles
- **Duration**: 56 hours driving
- **Result**: Multiple days with 10-hour sleeper berth periods

## Configuration

### HOS Constraints
```python
from core.hos import HOSConstraints

constraints = HOSConstraints(
    max_driving_hours=11,        # Daily driving limit
    max_duty_hours=14,           # Daily duty limit
    break_after_driving_hours=8, # Break trigger
    break_duration_minutes=30,   # Break duration
    sleeper_berth_hours=10,      # Sleeper berth requirement
    max_hours_8_days=70,         # 70/8 rolling rule
)
```

## Testing

Run the example script to see the HOS service in action:

```bash
python3 example_hos_usage.py
```

This will demonstrate:
- Short trips (no breaks)
- Medium trips (30-minute breaks)
- Long trips (multi-day with sleeper berth)
- Custom constraint configurations

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run migrations:
```bash
python3 manage.py migrate
```

3. Start the server:
```bash
python3 manage.py runserver
```

4. Access the API at `http://127.0.0.1:8000/api/`

## Admin Interface

Access the Django admin at `http://127.0.0.1:8000/admin/` to:
- View and manage trips
- Monitor stops and log entries
- Track HOS compliance
- Create superuser: `python3 manage.py createsuperuser`

## Compliance Features

- ✅ **11-hour driving limit** - Prevents exceeding daily driving maximum
- ✅ **14-hour duty window** - Tracks total on-duty time
- ✅ **30-minute break** - Automatic break after 8 hours driving
- ✅ **10-hour sleeper berth** - Enforces rest requirements
- ✅ **70/8 rolling rule** - Validates weekly hour limits
- ✅ **Multi-day scheduling** - Handles long-haul trips
- ✅ **Location tracking** - Estimates progress and locations
- ✅ **API integration** - Full REST API support
