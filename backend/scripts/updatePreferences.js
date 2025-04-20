// Script to update user preferences
require('dotenv').config();
const logger = require('../utils/logger');
const db = require('../db/models');
const { updateAllUserPreferences } = require('../utils/updatePreferences');

async function main() {
  try {
    logger.info('Starting script to update user preferences');
    
    // Connect to the database
    await db.sequelize.authenticate();
    logger.info('Connected to the database');
    
    // Update all user preferences
    const result = await updateAllUserPreferences();
    logger.info(`Updated ${result.updatedCount} user preferences, ${result.failedCount} failed`);
    
    // Run auto-booking process
    const scheduler = require('../utils/scheduler');
    logger.info('Running auto-booking process for all users');
    const bookingResult = await scheduler.processAutoBookingsForAllUsers();
    logger.info(`Auto-booking process complete: ${bookingResult.successCount} succeeded, ${bookingResult.failedCount} failed, ${bookingResult.noPrefsCount} skipped`);
    
    logger.info('Script completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();