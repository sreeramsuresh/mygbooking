#!/bin/bash

# Set the correct directory
cd "$(dirname "$0")"

# Check if NODE_ENV is set, default to development
if [ -z "$NODE_ENV" ]; then
  export NODE_ENV=development
fi

# Ensure .env file is loaded properly
if [ -f .env ]; then
  echo "Loading environment variables from .env"
  
  # Read .env file line by line and export valid variables
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip empty lines and comments
    if [[ ! "$line" =~ ^[[:space:]]*# && -n "$line" ]]; then
      # Export the environment variable
      export "$line"
    fi
  done < .env
fi

# Check if database service is running
echo "Checking if database service is running..."
if nc -z localhost 27017 2>/dev/null || nc -z localhost 3306 2>/dev/null || nc -z localhost 5432 2>/dev/null; then
  echo "Database connection confirmed."
else
  echo "WARNING: No database seems to be running on common ports. Make sure your database is running."
  echo "Would you like to continue anyway? (y/n)"
  read -r response
  if [[ "$response" != "y" && "$response" != "Y" ]]; then
    echo "Exiting."
    exit 1
  fi
fi

# 1. Remove all admin bookings
echo "Step 1: Removing admin bookings..."
node scripts/removeAdminBookings.js
if [ $? -ne 0 ]; then
  echo "Error in step 1. Would you like to continue? (y/n)"
  read -r response
  if [[ "$response" != "y" && "$response" != "Y" ]]; then
    echo "Exiting."
    exit 1
  fi
fi

# 2. Update all user preferences
echo "Step 2: Updating all user preferences..."
node scripts/updatePreferences.js
if [ $? -ne 0 ]; then
  echo "Error in step 2. Would you like to continue? (y/n)"
  read -r response
  if [[ "$response" != "y" && "$response" != "Y" ]]; then
    echo "Exiting."
    exit 1
  fi
fi

# 3. Fix Muthu's bookings specifically
echo "Step 3: Fixing Muthu's bookings..."
node scripts/fixMuthuBookings.js
if [ $? -ne 0 ]; then
  echo "Error in step 3."
  echo "Some steps may have failed. Please check the logs for details."
else
  echo "All fixes completed successfully!"
fi