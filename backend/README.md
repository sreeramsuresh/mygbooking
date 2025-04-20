# MyGBooking Backend

Backend service for the Office Seat Booking Application.

## Auto-Booking System

The system automatically creates bookings for all users based on their preferred work days without requiring admin intervention or user login.

### How Auto-Booking Works

1. **Automatic Scheduling:**
   - The auto-booking system runs automatically on server startup
   - It also runs every 6 hours via a cron job
   - It books seats for all active users for the next 4 weeks based on their preferences

2. **User Preferences:**
   - Each user has `defaultWorkDays` (days they prefer to come to office)
   - Each user has `requiredDaysPerWeek` (how many days they need to be in office)
   - The system automatically books the required number of days from their preferred days

3. **Auto-Booking Behavior:**
   - The system books seats for all 4 weeks (including the current week)
   - Users can manually override any auto-booking by canceling and rebooking

## Troubleshooting

If auto-bookings are not appearing for some users:

1. Run the fix script:
   ```
   ./run-fix-bookings.sh
   ```

2. This script:
   - Updates all user preferences based on the predefined list
   - Creates new auto-bookings for all users
   - Specifically fixes any issues with Muthu's bookings

## Adding New Users

When adding new users, make sure to set their preferences:

1. Update their profile with:
   - `defaultWorkDays`: Array of preferred days (0=Sunday, 1=Monday, etc.)
   - `requiredDaysPerWeek`: Number of days they need to be in office

2. After creating a new user, run:
   ```
   node scripts/updatePreferences.js
   ```

This will ensure new users are included in the auto-booking system without requiring admin to manually book seats or generate requests.