import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'

const TripForm = ({ onCancel }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    cycle_hours: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/trips/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          start_time: new Date().toISOString()
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to trip details page
        navigate(`/trips/${data.trip.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create trip')
      }
    } catch (error) {
      console.error('Error creating trip:', error)
      setError('Failed to create trip. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={onCancel}
        className="absolute top-2 right-2 sm:top-0 sm:right-0 text-gray-400 hover:text-gray-600 p-1"
      >
        <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <div className="px-4 sm:px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 pr-8">Create New Trip</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="current_location" className="block text-sm font-medium text-gray-700">
              Current Location *
            </label>
            <input
              type="text"
              id="current_location"
              name="current_location"
              value={formData.current_location}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              placeholder="e.g., New York, NY"
            />
          </div>

          <div>
            <label htmlFor="pickup_location" className="block text-sm font-medium text-gray-700">
              Pickup Location *
            </label>
            <input
              type="text"
              id="pickup_location"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              placeholder="e.g., New York, NY"
            />
          </div>

          <div>
            <label htmlFor="dropoff_location" className="block text-sm font-medium text-gray-700">
              Dropoff Location *
            </label>
            <input
              type="text"
              id="dropoff_location"
              name="dropoff_location"
              value={formData.dropoff_location}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              placeholder="e.g., Los Angeles, CA"
            />
          </div>

          <div>
            <label htmlFor="cycle_hours" className="block text-sm font-medium text-gray-700">
              Cycle Hours *
            </label>
            <input
              type="number"
              id="cycle_hours"
              name="cycle_hours"
              value={formData.cycle_hours}
              onChange={handleChange}
              required
              min="0"
              step="0.1"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              placeholder="e.g., 11.5"
            />
            <p className="mt-1 text-xs sm:text-sm text-gray-500">Total driving hours for this trip</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TripForm
