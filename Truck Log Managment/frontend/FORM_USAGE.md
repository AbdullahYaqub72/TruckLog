# Trip Form Usage Guide

## Simplified Trip Creation Form

The trip creation form has been simplified to include only the essential fields as requested:

### Form Fields

1. **Current Location** (required)
   - Where the truck is currently located
   - Example: "Chicago, IL"

2. **Pickup Location** (required)
   - Where the trip will start
   - Example: "New York, NY"

3. **Dropoff Location** (required)
   - Final destination of the trip
   - Example: "Los Angeles, CA"

4. **Cycle Hours** (required)
   - Total driving hours for this trip
   - Example: "11.5"

### Form Behavior

1. **Form Submission**:
   - Validates all required fields
   - Sends POST request to `/api/trips/`
   - Includes current timestamp as `start_time`

2. **Success Response**:
   - Automatically redirects to Trip Details page
   - URL: `/trips/{trip_id}`
   - Shows comprehensive trip information

3. **Error Handling**:
   - Displays validation errors
   - Shows network error messages
   - Form remains open for corrections

### API Integration

The form sends the following data to the backend:

```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "New York, NY", 
  "dropoff_location": "Los Angeles, CA",
  "cycle_hours": "11.5",
  "start_time": "2025-09-13T01:57:05.898799Z"
}
```

### Backend Processing

The backend automatically:
- Calculates route using OSRM
- Schedules HOS-compliant driving and rest periods
- Adds fuel stops every 1000 miles
- Creates pickup and dropoff stops (1 hour each)
- Generates daily log sheets

### User Flow

1. User clicks "Create New Trip" button
2. Modal form opens with 4 input fields
3. User fills in all required fields
4. User clicks "Create Trip" button
5. Form submits to backend API
6. On success: Redirects to Trip Details page
7. On error: Shows error message, form stays open

### Testing

The form has been tested and verified to work correctly:
- ✅ All fields are required and validated
- ✅ Form submission works with backend API
- ✅ Successful creation redirects to trip details
- ✅ Error handling displays appropriate messages
- ✅ Backend processes form data and creates HOS-compliant schedule

### Example Usage

1. **Current Location**: "Chicago, IL"
2. **Pickup Location**: "New York, NY" 
3. **Dropoff Location**: "Los Angeles, CA"
4. **Cycle Hours**: "11.5"

Result: Creates a trip with route calculation, HOS scheduling, and redirects to detailed trip view showing log sheets, stops, and route information.
