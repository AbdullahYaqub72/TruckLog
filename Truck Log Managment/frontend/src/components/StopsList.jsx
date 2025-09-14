import { MapPinIcon, ClockIcon, TruckIcon, BoltIcon } from '@heroicons/react/24/outline'

const StopsList = ({ stops }) => {
  const getStopIcon = (type) => {
    switch (type) {
      case 'pickup':
        return <TruckIcon className="h-5 w-5 text-green-600" />
      case 'dropoff':
        return <TruckIcon className="h-5 w-5 text-red-600" />
      case 'fuel':
        return <BoltIcon className="h-5 w-5 text-blue-600" />
      case 'rest':
        return <ClockIcon className="h-5 w-5 text-purple-600" />
      default:
        return <MapPinIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getStopColor = (type) => {
    switch (type) {
      case 'pickup':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'dropoff':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'fuel':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'rest':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (timeString) => {
    return new Date(timeString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end - start
    const diffHours = diffMs / (1000 * 60 * 60)
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60))
      return `${diffMinutes}m`
    }
    
    return `${diffHours.toFixed(1)}h`
  }

  if (!stops || stops.all.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8">
        <MapPinIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No stops scheduled</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">Stops will appear here when a trip is created.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Stops by Type */}
      {Object.entries(stops.by_type).map(([type, typeStops]) => (
        <div key={type} className="space-y-2">
          <h4 className="text-xs sm:text-sm font-medium text-gray-700 capitalize">
            {type.replace('_', ' ')} ({typeStops.length})
          </h4>
          <div className="space-y-2">
            {typeStops.map((stop, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border ${getStopColor(type)}`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    {getStopIcon(type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium truncate">{stop.location}</p>
                    <p className="text-xs opacity-75 truncate">
                      {formatDate(stop.start_time)} • {formatTime(stop.start_time)} - {formatTime(stop.end_time)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs sm:text-sm font-medium">
                    {calculateDuration(stop.start_time, stop.end_time)}
                  </p>
                  <p className="text-xs opacity-75">Duration</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h5 className="text-xs sm:text-sm font-medium text-gray-900">Total Stops</h5>
            <p className="text-xs sm:text-sm text-gray-500">
              {stops.total_count} stops scheduled
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <div className="text-base sm:text-lg font-semibold text-gray-900">
              {stops.total_count}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">stops</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StopsList
