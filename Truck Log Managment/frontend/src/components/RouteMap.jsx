import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icons for different stop types
const createCustomIcon = (color, type) => {
  const iconHtml = `
    <div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
    ">
      ${type === 'pickup' ? 'P' : type === 'dropoff' ? 'D' : type === 'fuel' ? 'F' : 'R'}
    </div>
  `
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  })
}

// Map bounds calculator component
const MapBounds = ({ coordinates }) => {
  const map = useMap()
  
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates)
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [coordinates, map])
  
  return null
}

// Route polyline component
const RoutePolyline = ({ routeGeometry }) => {
  if (!routeGeometry || routeGeometry.length < 2) {
    return null
  }
  
  // Convert route geometry to lat/lng format for Leaflet
  const polylineCoords = routeGeometry.map(coord => [coord[1], coord[0]]) // [lng, lat] -> [lat, lng]
  
  return (
    <Polyline
      positions={polylineCoords}
      color="#3b82f6"
      weight={4}
      opacity={0.8}
    />
  )
}

// Stop markers component
const StopMarkers = ({ stops, waypoints }) => {
  const getStopIcon = (type) => {
    switch (type) {
      case 'pickup':
      case 'pickup_stop':
        return createCustomIcon('#10b981', 'pickup')
      case 'dropoff':
      case 'dropoff_stop':
        return createCustomIcon('#ef4444', 'dropoff')
      case 'fuel':
        return createCustomIcon('#3b82f6', 'fuel')
      case 'rest':
        return createCustomIcon('#8b5cf6', 'rest')
      default:
        return createCustomIcon('#6b7280', 'stop')
    }
  }

  const getStopTypeLabel = (type) => {
    switch (type) {
      case 'pickup':
        return 'Pickup Location'
      case 'pickup_stop':
        return 'Pickup Stop'
      case 'dropoff':
        return 'Dropoff Location'
      case 'dropoff_stop':
        return 'Dropoff Stop'
      case 'fuel':
        return 'Fuel Stop'
      case 'rest':
        return 'Rest Stop'
      default:
        return 'Stop'
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (timeString) => {
    if (!timeString) return 'N/A'
    return new Date(timeString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Combine stops and waypoints for markers
  const allMarkers = []
  
  // Add waypoints (route points)
  if (waypoints) {
    waypoints.forEach((waypoint, index) => {
      if (waypoint.coords) {
        allMarkers.push({
          id: `waypoint-${index}`,
          position: [waypoint.coords[1], waypoint.coords[0]], // [lat, lng]
          type: waypoint.type,
          name: waypoint.name,
          isWaypoint: true
        })
      }
    })
  }
  
  // Add stops (scheduled stops with times)
  if (stops && stops.all) {
    stops.all.forEach((stop, index) => {
      // Try to find coordinates from waypoints
      const waypoint = waypoints?.find(wp => 
        wp.name === stop.location || 
        wp.type === stop.type
      )
      
      if (waypoint && waypoint.coords) {
        allMarkers.push({
          id: `stop-${stop.id || index}`,
          position: [waypoint.coords[1], waypoint.coords[0]], // [lat, lng]
          type: stop.type,
          name: stop.location,
          startTime: stop.start_time,
          endTime: stop.end_time,
          isWaypoint: false
        })
      }
    })
  }

  return (
    <>
      {allMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={getStopIcon(marker.type)}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-semibold text-gray-900 mb-2">
                {getStopTypeLabel(marker.type)}
              </h4>
              <p className="text-sm text-gray-700 mb-2">
                {marker.name}
              </p>
              {!marker.isWaypoint && marker.startTime && (
                <div className="text-xs text-gray-500">
                  <p>
                    <strong>Date:</strong> {formatDate(marker.startTime)}
                  </p>
                  <p>
                    <strong>Time:</strong> {formatTime(marker.startTime)} - {formatTime(marker.endTime)}
                  </p>
                </div>
              )}
              <div className="mt-2 text-xs">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                  marker.type.includes('pickup') ? 'bg-green-500' :
                  marker.type.includes('dropoff') ? 'bg-red-500' :
                  marker.type === 'fuel' ? 'bg-blue-500' :
                  marker.type === 'rest' ? 'bg-purple-500' : 'bg-gray-500'
                }`}></span>
                <span className="text-gray-600">
                  {getStopTypeLabel(marker.type)}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

const RouteMap = ({ trip }) => {
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]) // Default to NYC
  const [routeCoordinates, setRouteCoordinates] = useState([])

  useEffect(() => {
    // Set map center based on pickup location or route
    if (trip?.route?.waypoints && trip.route.waypoints.length > 0) {
      const firstWaypoint = trip.route.waypoints[0]
      if (firstWaypoint.coords) {
        setMapCenter([firstWaypoint.coords[1], firstWaypoint.coords[0]])
      }
    }

    // Extract route coordinates for polyline
    if (trip?.route?.route_geometry) {
      const coords = trip.route.route_geometry.map(coord => [coord[1], coord[0]]) // [lng, lat] -> [lat, lng]
      setRouteCoordinates(coords)
    }
  }, [trip])

  if (!trip) {
    return (
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Route Map</h3>
          <p className="text-gray-500">No trip data available</p>
        </div>
      </div>
    )
  }

  const route = trip.route?.route || {}
  const waypoints = trip.route?.waypoints || []
  const stops = trip.stops || {}

  return (
    <div className="space-y-4">
      {/* Route Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
          <h4 className="text-xs sm:text-sm font-medium text-blue-900">Distance</h4>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">
            {route.distance_miles?.toFixed(0) || 'N/A'} mi
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 sm:p-4">
          <h4 className="text-xs sm:text-sm font-medium text-green-900">Duration</h4>
          <p className="text-lg sm:text-2xl font-bold text-green-600">
            {route.duration_hours?.toFixed(1) || 'N/A'}h
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <h4 className="text-xs sm:text-sm font-medium text-purple-900">Driving Time</h4>
          <p className="text-lg sm:text-2xl font-bold text-purple-600">
            {route.driving_hours?.toFixed(1) || 'N/A'}h
          </p>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
          <h4 className="text-base sm:text-lg font-medium text-gray-900">Route Map</h4>
          <p className="text-xs sm:text-sm text-gray-500">
            Interactive map showing route from {trip.trip.pickup_location} to {trip.trip.dropoff_location}
          </p>
        </div>
        
        <div className="h-64 sm:h-80 lg:h-96">
          <MapContainer
            center={mapCenter}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            touchZoom={true}
            doubleClickZoom={true}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Route polyline */}
            <RoutePolyline routeGeometry={trip.route?.route_geometry} />
            
            {/* Stop markers */}
            <StopMarkers stops={stops} waypoints={waypoints} />
            
            {/* Auto-fit bounds */}
            <MapBounds coordinates={routeCoordinates} />
          </MapContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
        <h5 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">Map Legend</h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"></div>
            <span className="text-gray-700">Pickup</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"></div>
            <span className="text-gray-700">Dropoff</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"></div>
            <span className="text-gray-700">Fuel Stop</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"></div>
            <span className="text-gray-700">Rest Stop</span>
          </div>
        </div>
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
          <div className="flex items-center text-xs sm:text-sm">
            <div className="w-6 sm:w-8 h-1 bg-blue-500 mr-1.5 sm:mr-2 flex-shrink-0"></div>
            <span className="text-gray-700">Route Line</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RouteMap