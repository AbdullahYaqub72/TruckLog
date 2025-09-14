# Truck Log Management API Documentation

## Overview

The Truck Log Management API provides comprehensive route calculation, Hours of Service (HOS) scheduling, and trip management for commercial truck drivers. The API integrates with OpenStreetMap via OSRM for real-time route calculation and enforces DOT HOS regulations.

## Base URL

```
http://127.0.0.1:8000/api/
```

## Authentication

Currently no authentication is required. In production, implement proper API authentication.

## Endpoints

### 1. Trips

**Endpoint:** `/api/trips/`

#### GET - List Trips
Get all trips.

**Response:**
```json
[
    {
        "id": 1,
        "current_location": "New York, NY",
        "pickup_location": "New York, NY",
        "dropoff_location": "Los Angeles, CA",
        "cycle_hours": "49.75",
        "created_at": "2024-01-01T06:00:00Z"
    }
]
```

#### POST - Create Trip
Create a trip with HOS + routing, return logs & stops.

**Request Body:**
```json
{
    "pickup_location": "New York, NY",
    "dropoff_location": "Los Angeles, CA",
    "current_location": "New York, NY",
    "start_time": "2024-01-01T06:00:00Z",
    "fuel_interval_miles": 1000.0
}
```

**Parameters:**
- `pickup_location` (required): Trip origin
- `dropoff_location` (required): Trip destination
- `current_location` (optional): Current truck location (defaults to pickup_location)
- `start_time` (optional): Trip start time (defaults to current time)
- `fuel_interval_miles` (optional): Distance interval for fuel stops (default: 1000.0)

**Response:**
```json
{
    "trip": {
        "id": 1,
        "current_location": "New York, NY",
        "pickup_location": "New York, NY",
        "dropoff_location": "Los Angeles, CA",
        "cycle_hours": "49.75",
        "created_at": "2024-01-01T06:00:00Z"
    },
    "route": {
        "distance_miles": 2794.04,
        "duration_hours": 52.75,
        "driving_hours": 49.75,
        "stops_hours": 3.0
    },
    "waypoints": [
        {
            "name": "New York, NY",
            "type": "pickup",
            "latitude": 40.7128,
            "longitude": -74.0060
        },
        {
            "name": "Pickup Stop - New York, NY",
            "type": "pickup_stop",
            "latitude": 40.7128,
            "longitude": -74.0060
        },
        {
            "name": "Fuel Stop 1",
            "type": "fuel",
            "latitude": 39.8283,
            "longitude": -98.5795
        },
        {
            "name": "Dropoff Stop - Los Angeles, CA",
            "type": "dropoff_stop",
            "latitude": 34.0522,
            "longitude": -118.2437
        },
        {
            "name": "Los Angeles, CA",
            "type": "dropoff",
            "latitude": 34.0522,
            "longitude": -118.2437
        }
    ],
    "stops": [
        {
            "id": 1,
            "trip": 1,
            "location": "Pickup Stop - New York, NY",
            "type": "pickup",
            "start_time": "2024-01-01T06:00:00Z",
            "end_time": "2024-01-01T07:00:00Z"
        },
        {
            "id": 2,
            "trip": 1,
            "location": "Fuel Stop 1",
            "type": "fuel",
            "start_time": "2024-01-01T14:00:00Z",
            "end_time": "2024-01-01T14:30:00Z"
        }
    ],
    "log_entries": [
        {
            "id": 1,
            "trip": 1,
            "day": "2024-01-01",
            "status": "driving",
            "start_hour": "06:00:00",
            "end_hour": "17:00:00",
            "location": "En route to Los Angeles, CA (20%)"
        }
    ],
    "summary": {
        "total_stops": 8,
        "total_log_entries": 12,
        "trip_duration_days": 3,
        "total_driving_hours": 49.75,
        "route_distance_miles": 2794.04,
        "route_duration_hours": 52.75
    }
}
```

### 2. Trip Details

**Endpoint:** `GET /api/trips/{trip_id}/`

Fetch trip details, stops, and log sheets.

**Response:**
```json
{
    "trip": {
        "id": 1,
        "current_location": "New York, NY",
        "pickup_location": "New York, NY",
        "dropoff_location": "Los Angeles, CA",
        "cycle_hours": "49.75",
        "created_at": "2024-01-01T06:00:00Z"
    },
    "stops": {
        "all": [
            {
                "id": 1,
                "trip": 1,
                "location": "Pickup Stop - New York, NY",
                "type": "pickup",
                "start_time": "2024-01-01T06:00:00Z",
                "end_time": "2024-01-01T07:00:00Z"
            }
        ],
        "by_type": {
            "pickup": [
                {
                    "id": 1,
                    "trip": 1,
                    "location": "Pickup Stop - New York, NY",
                    "type": "pickup",
                    "start_time": "2024-01-01T06:00:00Z",
                    "end_time": "2024-01-01T07:00:00Z"
                }
            ],
            "fuel": [
                {
                    "id": 2,
                    "trip": 1,
                    "location": "Fuel Stop 1",
                    "type": "fuel",
                    "start_time": "2024-01-01T14:00:00Z",
                    "end_time": "2024-01-01T14:30:00Z"
                }
            ]
        },
        "total_count": 8
    },
    "log_sheets": {
        "daily": [
            {
                "date": "2024-01-01",
                "day_name": "Monday",
                "entries": [
                    {
                        "id": 1,
                        "trip": 1,
                        "day": "2024-01-01",
                        "status": "driving",
                        "start_hour": "06:00:00",
                        "end_hour": "17:00:00",
                        "location": "En route to Los Angeles, CA (20%)"
                    }
                ],
                "driving_hours": 11.0,
                "on_duty_hours": 14.0,
                "total_entries": 4
            }
        ],
        "total_days": 3,
        "total_driving_hours": 49.75,
        "total_entries": 12
    },
    "summary": {
        "trip_duration_days": 3,
        "total_stops": 8,
        "total_log_entries": 12,
        "total_driving_hours": 49.75,
        "pickup_location": "New York, NY",
        "dropoff_location": "Los Angeles, CA",
        "created_at": "2024-01-01T06:00:00Z"
    }
}
```

### 3. Calculate Route

**Endpoint:** `POST /api/routes/calculate/`

Calculate route between two locations with fuel stops.

**Request Body:**
```json
{
    "start_location": "New York, NY",
    "end_location": "Los Angeles, CA",
    "fuel_interval_miles": 1000.0
}
```

**Parameters:**
- `start_location` (required): Starting location
- `end_location` (required): Destination location
- `fuel_interval_miles` (optional): Distance interval for fuel stops (default: 1000.0)

**Response:**
```json
{
    "route": {
        "distance_miles": 2794.04,
        "duration_hours": 52.75,
        "driving_hours": 49.75,
        "stops_hours": 3.0
    },
    "waypoints": [
        {
            "name": "New York, NY",
            "type": "pickup",
            "latitude": 40.7128,
            "longitude": -74.0060
        },
        {
            "name": "Pickup Stop - New York, NY",
            "type": "pickup_stop",
            "latitude": 40.7128,
            "longitude": -74.0060
        },
        {
            "name": "Fuel Stop 1",
            "type": "fuel",
            "latitude": 39.8283,
            "longitude": -98.5795
        },
        {
            "name": "Fuel Stop 2",
            "type": "fuel",
            "latitude": 36.7783,
            "longitude": -119.4179
        },
        {
            "name": "Dropoff Stop - Los Angeles, CA",
            "type": "dropoff_stop",
            "latitude": 34.0522,
            "longitude": -118.2437
        },
        {
            "name": "Los Angeles, CA",
            "type": "dropoff",
            "latitude": 34.0522,
            "longitude": -118.2437
        }
    ],
    "route_geometry": [
        [-74.0060, 40.7128],
        [-73.9857, 40.7484],
        ...
    ]
}
```

## Stop Types

- `pickup`: Pickup location waypoint
- `pickup_stop`: 1-hour pickup stop
- `dropoff`: Dropoff location waypoint
- `dropoff_stop`: 1-hour dropoff stop
- `fuel`: 30-minute fuel stop
- `rest`: HOS-required rest break

## Log Entry Status

- `driving`: Driver is driving
- `on-duty`: Driver is on-duty but not driving
- `sleeper`: Driver is in sleeper berth
- `off`: Driver is off-duty

## HOS Regulations

The API automatically enforces DOT Hours of Service regulations:

- **11-hour driving limit**: Maximum 11 hours of driving per day
- **14-hour duty window**: Total on-duty time including driving and non-driving activities
- **30-minute break**: Required after 8 hours of driving
- **10-hour sleeper berth**: Required rest period
- **70/8 rolling rule**: Maximum 70 hours in 8 consecutive days

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a descriptive message:

```json
{
    "error": "Location not found: Invalid City, ST"
}
```

## Rate Limiting

Currently no rate limiting is implemented. In production, implement appropriate rate limiting.

## Examples

### Create Trip (POST /api/trips/)

```bash
curl -X POST http://127.0.0.1:8000/api/trips/ \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_location": "New York, NY",
    "dropoff_location": "Los Angeles, CA",
    "current_location": "New York, NY",
    "start_time": "2024-01-01T06:00:00Z",
    "fuel_interval_miles": 1000.0
  }'
```

### List Trips (GET /api/trips/)

```bash
curl http://127.0.0.1:8000/api/trips/
```

### Get Trip Details (GET /api/trips/{id}/)

```bash
curl http://127.0.0.1:8000/api/trips/1/
```

### Calculate Route (POST /api/routes/calculate/)

```bash
curl -X POST http://127.0.0.1:8000/api/routes/calculate/ \
  -H "Content-Type: application/json" \
  -d '{
    "start_location": "New York, NY",
    "end_location": "Atlanta, GA",
    "fuel_interval_miles": 1000.0
  }'
```

## Map Integration

The API uses OpenStreetMap via OSRM (Open Source Routing Machine) for:

- Real-time route calculation
- Distance and duration estimation
- Turn-by-turn directions
- Traffic-aware routing

## Fuel Stop Logic

Fuel stops are automatically added every specified interval:

- Default interval: 1000 miles
- Customizable via `fuel_interval_miles` parameter
- 30-minute duration per fuel stop
- Positioned along the calculated route

## Pickup/Dropoff Stops

- **Pickup stops**: 1-hour duration at origin
- **Dropoff stops**: 1-hour duration at destination
- Automatically scheduled based on route waypoints

## Data Models

### Trip
- `id`: Auto-generated primary key
- `current_location`: Current truck location
- `pickup_location`: Trip origin
- `dropoff_location`: Trip destination
- `cycle_hours`: Total driving hours
- `created_at`: Creation timestamp

### Stop
- `id`: Auto-generated primary key
- `trip`: Foreign key to Trip
- `location`: Stop location
- `type`: Stop type (pickup/dropoff/fuel/rest)
- `start_time`: Stop start time
- `end_time`: Stop end time

### LogEntry
- `id`: Auto-generated primary key
- `trip`: Foreign key to Trip
- `day`: Date of the log entry
- `status`: Status (off/sleeper/driving/on-duty)
- `start_hour`: Start time
- `end_hour`: End time
- `location`: Location during this period
