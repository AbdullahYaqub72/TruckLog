# Truck Log Management - Frontend

A React frontend for the Truck Log Management system built with Vite, TailwindCSS, and React Router.

## Features

- **Home Page**: Dashboard with trip statistics and trip creation
- **Trip Details Page**: Comprehensive view of trip information including:
  - Daily log sheets with HOS compliance
  - Scheduled stops (pickup, fuel, dropoff, rest)
  - Route information and map placeholder
- **Responsive Design**: Mobile-friendly interface with TailwindCSS
- **Real-time Data**: Connects to Django REST API backend

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Heroicons** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server

The app runs on `http://localhost:5173` by default.

### Backend Integration

The frontend expects the Django backend to be running on `http://127.0.0.1:8000`. Make sure to start the Django server before using the frontend.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout wrapper
│   ├── TripForm.jsx    # Trip creation form
│   ├── TripCard.jsx    # Trip summary card
│   ├── LogSheet.jsx    # HOS log sheet display
│   ├── StopsList.jsx   # Stops list component
│   └── RouteMap.jsx    # Route map placeholder
├── pages/              # Page components
│   ├── Home.jsx        # Dashboard/home page
│   └── TripDetails.jsx # Trip details page
├── services/           # API service functions
├── App.jsx            # Main app component
├── main.jsx           # App entry point
└── index.css          # Global styles with TailwindCSS
```

## API Endpoints

The frontend integrates with these Django API endpoints:

- `GET /api/trips/` - List all trips
- `POST /api/trips/` - Create new trip
- `GET /api/trips/{id}/` - Get trip details
- `POST /api/routes/calculate/` - Calculate route

## Features

### Home Page
- Trip statistics dashboard
- Create new trip form
- Recent trips list
- Responsive grid layout

### Trip Details Page
- Trip summary with key metrics
- Daily log sheets with HOS compliance
- Stops organized by type
- Route information and map placeholder

### Components
- **TripForm**: Modal form for creating trips
- **TripCard**: Trip summary card with status indicators
- **LogSheet**: HOS-compliant log sheet display
- **StopsList**: Organized stops by type
- **RouteMap**: Route visualization (placeholder)

## Styling

The app uses TailwindCSS with a custom color palette:
- Primary blue colors for main UI elements
- Truck-themed gray colors for secondary elements
- Status-based colors for different trip states

## Development

### Adding New Components

1. Create component in `src/components/`
2. Import and use in pages
3. Follow existing patterns for styling and structure

### API Integration

API calls are made directly in components using `fetch()`. For larger apps, consider:
- Creating a dedicated API service layer
- Adding error handling and loading states
- Implementing caching strategies

## Deployment

Build the app for production:

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.