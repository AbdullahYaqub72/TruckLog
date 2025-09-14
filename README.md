# Trip Logs Django Project

A comprehensive Django project for managing truck trip logs with real-time route calculation, fuel stop planning, and Hours of Service (HOS) compliance.

## Project Setup

This project includes:
- Django 5.2.6
- Django REST Framework 3.16.1
- SQLite database (default)
- PostgreSQL support (psycopg2-binary installed)
- OpenStreetMap integration via OSRM
- Real-time route calculation
- Automatic fuel stop planning
- DOT HOS compliance enforcement

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run migrations:
```bash
python manage.py migrate
```

3. Start the development server:
```bash
python manage.py runserver
```

## Project Structure

- `triplogs/` - Main Django project settings
- `core/` - Core Django app for the application logic
- `requirements.txt` - Python dependencies

## Database

The project is configured to use SQLite by default. To use PostgreSQL instead, update the `DATABASES` setting in `triplogs/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_database_name',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## API

The project includes a comprehensive REST API with the following endpoints:

- `POST /api/trips/` - Create trip with HOS + routing, return logs & stops
- `GET /api/trips/` - List all trips
- `GET /api/trips/{id}/` - Fetch trip details, stops, and log sheets
- `POST /api/routes/calculate/` - Calculate route with fuel stops

### Key Features

- **Real-time route calculation** using OpenStreetMap via OSRM
- **Automatic fuel stops** every 1,000 miles (configurable)
- **Pickup/dropoff stops** with 1-hour duration each
- **HOS compliance** with 11-hour driving limit, 14-hour duty window, and 30-minute breaks
- **Multi-day trip support** with sleeper berth requirements

### Example API Usage

```bash
# Create trip with HOS + routing
curl -X POST http://127.0.0.1:8000/api/trips/ \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_location": "New York, NY",
    "dropoff_location": "Los Angeles, CA",
    "start_time": "2024-01-01T06:00:00Z"
  }'

# List trips
curl http://127.0.0.1:8000/api/trips/

# Get trip details
curl http://127.0.0.1:8000/api/trips/1/

# Calculate route only
curl -X POST http://127.0.0.1:8000/api/routes/calculate/ \
  -H "Content-Type: application/json" \
  -d '{
    "start_location": "New York, NY",
    "end_location": "Los Angeles, CA",
    "fuel_interval_miles": 1000.0
  }'
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

## Frontend

The project includes a React frontend built with Vite and TailwindCSS.

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Access the frontend:**
- Frontend URL: `http://localhost:5173`
- Make sure Django backend is running for full functionality

### Frontend Features

- **Dashboard**: Trip statistics and creation
- **Trip Details**: Comprehensive trip view with log sheets
- **Responsive Design**: Mobile-friendly interface
- **Real-time Integration**: Connects to Django REST API

See [frontend/README.md](frontend/README.md) for detailed frontend documentation.
