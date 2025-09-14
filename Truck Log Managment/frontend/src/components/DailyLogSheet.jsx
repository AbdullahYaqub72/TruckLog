import React, { useState, useMemo, useRef } from 'react'
import { 
  ClockIcon, 
  TruckIcon, 
  MoonIcon, 
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const DailyLogSheet = ({ logEntries = [], date, onEdit }) => {
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const logSheetRef = useRef(null)

  // Duty status configuration
  const dutyStatuses = [
    { 
      id: 'off', 
      name: 'Off Duty', 
      color: 'bg-gray-100', 
      borderColor: 'border-gray-300',
      textColor: 'text-gray-700',
      icon: UserIcon,
      description: 'Not on duty'
    },
    { 
      id: 'sleeper', 
      name: 'Sleeper Berth', 
      color: 'bg-purple-100', 
      borderColor: 'border-purple-300',
      textColor: 'text-purple-700',
      icon: MoonIcon,
      description: 'In sleeper berth'
    },
    { 
      id: 'driving', 
      name: 'Driving', 
      color: 'bg-green-100', 
      borderColor: 'border-green-300',
      textColor: 'text-green-700',
      icon: TruckIcon,
      description: 'Driving vehicle'
    },
    { 
      id: 'on-duty', 
      name: 'On Duty', 
      color: 'bg-blue-100', 
      borderColor: 'border-blue-300',
      textColor: 'text-blue-700',
      icon: ClockIcon,
      description: 'On duty but not driving'
    }
  ]

  // Convert time string to minutes since midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0
    // Handle time strings that might have milliseconds
    const cleanTimeStr = timeStr.split('.')[0] // Remove milliseconds if present
    const [hours, minutes] = cleanTimeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Convert minutes to time string
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Process log entries into time blocks
  const timeBlocks = useMemo(() => {
    if (!logEntries || logEntries.length === 0) return []

    const blocks = []
    const sortedEntries = [...logEntries].sort((a, b) => 
      timeToMinutes(a.start_hour) - timeToMinutes(b.start_hour)
    )

    sortedEntries.forEach((entry, index) => {
      const startMinutes = timeToMinutes(entry.start_hour)
      const endMinutes = timeToMinutes(entry.end_hour)
      let duration = endMinutes - startMinutes
      
      // Handle case where end time is before start time (crosses midnight)
      if (duration < 0) {
        duration = (24 * 60) + duration // Add 24 hours
      }
      
      // Ensure duration is not negative
      duration = Math.max(0, duration)

      // Check for violations
      const violations = []
      if (entry.status === 'driving' && duration > 11 * 60) {
        violations.push('Exceeds 11-hour driving limit')
      }
      if (entry.status === 'on-duty' && duration > 14 * 60) {
        violations.push('Exceeds 14-hour duty limit')
      }

      blocks.push({
        id: `${date}-${index}`,
        status: entry.status,
        startTime: entry.start_hour,
        endTime: entry.end_hour,
        startMinutes,
        endMinutes,
        duration,
        location: entry.location,
        violations,
        isFirst: index === 0,
        isLast: index === sortedEntries.length - 1
      })
    })

    return blocks
  }, [logEntries, date])

  // Generate 24-hour grid
  const hourMarkers = Array.from({ length: 25 }, (_, i) => ({
    hour: i,
    minutes: i * 60,
    label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
  }))

  // Calculate total hours by status
  const statusTotals = useMemo(() => {
    const totals = {}
    dutyStatuses.forEach(status => {
      totals[status.id] = 0
    })

    timeBlocks.forEach(block => {
      const hours = Math.max(0, block.duration / 60) // Ensure no negative hours
      totals[block.status] += hours
    })

    return totals
  }, [timeBlocks])

  // Get status configuration
  const getStatusConfig = (statusId) => {
    return dutyStatuses.find(s => s.id === statusId) || dutyStatuses[0]
  }

  // Calculate block position and width
  const getBlockStyle = (block) => {
    const leftPercent = (block.startMinutes / (24 * 60)) * 100
    const widthPercent = (block.duration / (24 * 60)) * 100
    const statusConfig = getStatusConfig(block.status)

    // Define better colors for each status
    const statusColors = {
      'off': '#6b7280', // gray-500
      'sleeper': '#8b5cf6', // purple-500
      'driving': '#10b981', // emerald-500
      'on-duty': '#3b82f6' // blue-500
    }

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      backgroundColor: statusColors[block.status] || '#6b7280',
      borderColor: 'white',
      borderWidth: '2px',
      borderStyle: 'solid',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }
  }

  // Generate remarks for duty changes
  const generateRemarks = () => {
    const remarks = []
    
    timeBlocks.forEach((block, index) => {
      if (block.isFirst) {
        remarks.push({
          time: block.startTime,
          text: `Start of duty day - ${block.status} at ${block.location}`,
          type: 'start'
        })
      }

      if (!block.isLast) {
        const nextBlock = timeBlocks[index + 1]
        if (block.status !== nextBlock.status) {
          remarks.push({
            time: block.endTime,
            text: `Change from ${block.status} to ${nextBlock.status} at ${block.location}`,
            type: 'change'
          })
        }
      }

      if (block.violations.length > 0) {
        remarks.push({
          time: block.startTime,
          text: `⚠️ ${block.violations.join(', ')}`,
          type: 'violation'
        })
      }
    })

    return remarks.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
  }

  const remarks = generateRemarks()

  // PDF Export functionality
  const exportToPDF = async () => {
    if (!logSheetRef.current) return

    setIsExporting(true)
    try {
      // Create a temporary container for PDF styling
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '0'
      tempContainer.style.width = '800px'
      tempContainer.style.backgroundColor = 'white'
      tempContainer.style.padding = '20px'
      tempContainer.style.fontFamily = 'Arial, sans-serif'
      
      // Clone the log sheet content
      const clonedContent = logSheetRef.current.cloneNode(true)
      
      // Remove interactive elements for PDF
      const buttons = clonedContent.querySelectorAll('button')
      buttons.forEach(button => button.remove())
      
      // Remove hover effects and make it print-friendly
      clonedContent.style.transform = 'none'
      clonedContent.style.boxShadow = 'none'
      clonedContent.style.border = '1px solid #000'
      clonedContent.style.borderRadius = '0'
      
      // Style the content for PDF
      const style = document.createElement('style')
      style.textContent = `
        .pdf-content * {
          box-shadow: none !important;
          transform: none !important;
          transition: none !important;
        }
        .pdf-content .hover\\:shadow-md:hover {
          box-shadow: none !important;
        }
        .pdf-content button {
          display: none !important;
        }
        .pdf-content .cursor-pointer {
          cursor: default !important;
        }
      `
      clonedContent.className = 'pdf-content'
      clonedContent.appendChild(style)
      
      tempContainer.appendChild(clonedContent)
      document.body.appendChild(tempContainer)
      
      // Generate canvas from HTML
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempContainer.scrollHeight
      })
      
      // Clean up temporary container
      document.body.removeChild(tempContainer)
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Add header information
      pdf.setFontSize(16)
      pdf.text('Daily Log Sheet', 20, 20)
      pdf.setFontSize(12)
      pdf.text(`Date: ${date}`, 20, 30)
      pdf.text(`Driver: [Driver Name]`, 20, 35)
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40)
      
      // Save the PDF
      const fileName = `log-sheet-${date.replace(/-/g, '')}.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div ref={logSheetRef} className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Daily Log Sheet - {date}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {timeBlocks.length} entries • {remarks.length} remarks
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md">
              <span className="font-medium">Total Hours:</span> {Object.values(statusTotals).reduce((sum, hours) => sum + hours, 0).toFixed(1)}h
            </div>
            <div className="flex space-x-2">
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(date)}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Duty Status Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {dutyStatuses.map(status => {
            const Icon = status.icon
            const totalHours = statusTotals[status.id]
            return (
              <div key={status.id} className="flex items-center space-x-3 p-2 bg-white rounded-md border">
                <div className={`w-4 h-4 rounded ${status.color} ${status.borderColor} border-2 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{status.name}</div>
                  <div className="text-xs text-gray-500">{totalHours.toFixed(1)}h</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 24-Hour Grid */}
      <div className="relative overflow-x-auto">
        {/* Scroll indicator */}
        <div className="absolute top-2 right-2 z-10 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          ← Scroll to see full timeline →
        </div>
        
        {/* Hour markers */}
        <div className="absolute top-0 left-0 right-0 h-8 sm:h-10 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 min-w-[800px]">
          {hourMarkers.map(marker => (
            <div
              key={marker.hour}
              className="absolute top-0 h-full border-l border-gray-300"
              style={{ left: `${(marker.minutes / (24 * 60)) * 100}%` }}
            >
              <div className="absolute -top-6 sm:-top-7 left-0 text-xs text-gray-600 transform -translate-x-1/2 whitespace-nowrap font-medium">
                {marker.hour % 2 === 0 ? marker.label : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Duty status rows */}
        <div className="pt-8 sm:pt-10 min-w-[800px]">
          {dutyStatuses.map(status => {
            const Icon = status.icon
            const statusBlocks = timeBlocks.filter(block => block.status === status.id)
            
            return (
              <div key={status.id} className="relative h-16 sm:h-20 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                {/* Status label */}
                <div className="absolute left-0 top-0 h-full w-24 sm:w-28 bg-gradient-to-r from-gray-50 to-gray-100 border-r border-gray-200 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    <span className="text-xs sm:text-sm font-medium text-gray-800">{status.name}</span>
                  </div>
                </div>

                {/* Time blocks */}
                <div className="ml-24 sm:ml-28 relative h-full">
                  {statusBlocks.map(block => {
                    const statusConfig = getStatusConfig(block.status)
                    return (
                      <div
                        key={block.id}
                        className="absolute top-1 bottom-1 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-200 group border-2 border-white"
                        style={getBlockStyle(block)}
                        onClick={() => setSelectedBlock(selectedBlock?.id === block.id ? null : block)}
                      >
                        <div className="h-full flex items-center justify-center p-1">
                          <div className="text-center">
                            <div className="text-xs font-semibold text-white drop-shadow-sm">
                              {block.startTime} - {block.endTime}
                            </div>
                            <div className="text-xs text-white/90 truncate max-w-[120px] drop-shadow-sm">
                              {block.location}
                            </div>
                            {block.violations.length > 0 && (
                              <ExclamationTriangleIcon className="w-3 h-3 text-red-200 mx-auto mt-1 drop-shadow-sm" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Remarks Section */}
      {remarks.length > 0 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
          <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">Remarks</h4>
          <div className="space-y-2">
            {remarks.map((remark, index) => (
              <div key={index} className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0">
                  {remark.type === 'violation' ? (
                    <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mt-0.5" />
                  ) : remark.type === 'start' ? (
                    <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mt-0.5" />
                  ) : (
                    <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mt-0.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-gray-700">
                    <span className="font-medium">{remark.time}</span> - {remark.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Block Details Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Block Details</h3>
              <button
                onClick={() => setSelectedBlock(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-500">Status</label>
                <div className="text-sm text-gray-900 capitalize">{selectedBlock.status}</div>
              </div>
              
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-500">Time</label>
                <div className="text-sm text-gray-900">
                  {selectedBlock.startTime} - {selectedBlock.endTime}
                </div>
              </div>
              
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-500">Duration</label>
                <div className="text-sm text-gray-900">
                  {(selectedBlock.duration / 60).toFixed(1)} hours
                </div>
              </div>
              
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-500">Location</label>
                <div className="text-sm text-gray-900 break-words">{selectedBlock.location}</div>
              </div>
              
              {selectedBlock.violations.length > 0 && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-red-500">Violations</label>
                  <div className="text-xs sm:text-sm text-red-600">
                    {selectedBlock.violations.map((violation, index) => (
                      <div key={index}>• {violation}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyLogSheet
