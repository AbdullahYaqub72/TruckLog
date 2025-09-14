import { Link } from 'react-router-dom'
import { MapIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'

const TripCard = ({ trip }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (createdAt) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffHours = (now - created) / (1000 * 60 * 60)
    
    if (diffHours < 24) return 'bg-green-100 text-green-800'
    if (diffHours < 168) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (createdAt) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffHours = (now - created) / (1000 * 60 * 60)
    
    if (diffHours < 24) return 'Recent'
    if (diffHours < 168) return 'This Week'
    return 'Older'
  }

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              Trip #{trip.id}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {formatDate(trip.created_at)}
            </p>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${getStatusColor(trip.created_at)}`}>
            {getStatusText(trip.created_at)}
          </span>
        </div>

        {/* Route */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <MapIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-medium truncate block sm:inline">{trip.pickup_location}</span>
              <span className="mx-1 sm:mx-2 hidden sm:inline">→</span>
              <span className="mx-1 sm:mx-2 sm:hidden">→</span>
              <span className="font-medium truncate block sm:inline">{trip.dropoff_location}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center text-gray-600">
            <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-orange-500 flex-shrink-0" />
            <span className="truncate">{trip.cycle_hours}h driving</span>
          </div>
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-500 flex-shrink-0" />
            <span className="truncate">Created {formatDate(trip.created_at)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-500">View Details</span>
            <div className="text-blue-600">
              <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default TripCard
