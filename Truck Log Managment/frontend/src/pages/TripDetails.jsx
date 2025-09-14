import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon, MapIcon, ClockIcon, TruckIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import LogSheet from '../components/LogSheet'
import StopsList from '../components/StopsList'
import RouteMap from '../components/RouteMap'

const TripDetails = () => {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('logs')

  useEffect(() => {
    fetchTripDetails()
  }, [id])

  const fetchTripDetails = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/trips/${id}/`)
      if (response.ok) {
        const data = await response.json()
        setTrip(data)
      } else {
        setError('Trip not found')
      }
    } catch (error) {
      console.error('Error fetching trip details:', error)
      setError('Failed to load trip details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <TruckIcon className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
        <p className="text-gray-500 mb-4">{error || 'Trip not found'}</p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>
    )
  }

  const tabs = [
    { id: 'logs', name: 'Log Sheets', icon: ClockIcon },
    { id: 'stops', name: 'Stops', icon: ListBulletIcon },
    { id: 'map', name: 'Route Map', icon: MapIcon }
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Link
            to="/"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-fit"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Trip #{trip.trip.id}
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              <span className="block sm:inline">{trip.trip.pickup_location}</span>
              <span className="mx-1 sm:mx-2">→</span>
              <span className="block sm:inline">{trip.trip.dropoff_location}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Trip Summary */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Trip Summary</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg mx-auto mb-2">
              <MapIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Distance</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">
              {trip.summary.route_distance_miles?.toFixed(0) || 'N/A'} mi
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg mx-auto mb-2">
              <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Duration</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">
              {trip.summary.trip_duration_days} days
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg mx-auto mb-2">
              <TruckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Driving Hours</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">
              {trip.summary.total_driving_hours}h
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg mx-auto mb-2">
              <MapIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">Stops</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">
              {trip.summary.total_stops}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="sm:hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden sm:block border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Daily Log Sheets</h3>
              <p className="text-sm text-gray-500">
                HOS-compliant log entries for each day of the trip
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <LogSheet logSheets={trip.log_sheets} />
            </div>
          </div>
        )}

        {activeTab === 'stops' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Scheduled Stops</h3>
              <p className="text-sm text-gray-500">
                Pickup, fuel, and dropoff stops along the route
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <StopsList stops={trip.stops} />
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Route Map</h3>
              <p className="text-sm text-gray-500">
                Visual representation of the trip route
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <RouteMap trip={trip} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TripDetails
