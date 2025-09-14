import React from 'react'
import DailyLogSheet from './DailyLogSheet'

const LogSheet = ({ logSheets, onEditLog }) => {
  if (!logSheets || logSheets.daily.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8">
        <p className="text-sm text-gray-500">No log entries available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Daily Log Sheets */}
      {logSheets.daily.map((day, dayIndex) => (
        <DailyLogSheet
          key={dayIndex}
          logEntries={day.entries}
          date={day.date}
          onEdit={onEditLog}
        />
      ))}

      {/* Overall Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h5 className="text-xs sm:text-sm font-medium text-blue-900">Trip Summary</h5>
            <p className="text-xs sm:text-sm text-blue-700">
              {logSheets.total_days} days • {logSheets.total_entries} log entries
            </p>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <div className="text-base sm:text-lg font-semibold text-blue-900">
              {logSheets.total_driving_hours}h driving
            </div>
            <div className="text-xs sm:text-sm text-blue-700">Total</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogSheet
