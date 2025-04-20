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

# Run the script
echo "Running user preferences update and auto-booking job..."
node scripts/updatePreferences.js

echo "Done!"