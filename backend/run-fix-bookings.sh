#!/bin/bash

# Set the correct directory
cd "$(dirname "$0")"

# Check if NODE_ENV is set, default to development
if [ -z "$NODE_ENV" ]; then
  export NODE_ENV=development
fi

# Ensure .env file is loaded
if [ -f .env ]; then
  echo "Loading environment variables from .env"
  export $(grep -v '^#' .env | xargs)
fi

# 1. Remove all admin bookings
echo "Step 1: Removing admin bookings..."
node scripts/removeAdminBookings.js

# 2. Update all user preferences
echo "Step 2: Updating all user preferences..."
node scripts/updatePreferences.js

# 3. Fix Muthu's bookings specifically
echo "Step 3: Fixing Muthu's bookings..."
node scripts/fixMuthuBookings.js

echo "All fixes completed!"