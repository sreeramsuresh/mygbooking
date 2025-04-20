// Script to fix Muthu's bookings specifically
require('dotenv').config();
const logger = require('../utils/logger');
const db = require('../db/models');
const bookingService = require('../services/booking.service');

async function main() {
  try {
    logger.info('Starting script to fix Muthu\'s bookings');
    
    // Connect to the database
    await db.sequelize.authenticate();
    logger.info('Connected to the database');
    
    // Find Muthu's user account
    const User = db.user;
    const muthu = await User.findOne({
      where: {
        username: {
          [db.Sequelize.Op.iLike]: 'muthu%'  // Case-insensitive search for any username starting with muthu
        },
        isActive: true
      }
    });
    
    if (!muthu) {
      logger.error('Muthu user not found in the database');
      process.exit(1);
    }
    
    logger.info(`Found user: ${muthu.username} (ID: ${muthu.id})`);
    
    // Update Muthu's preferences
    muthu.defaultWorkDays = [1, 4]; // Monday and Thursday
    muthu.requiredDaysPerWeek = 2;
    await muthu.save();
    logger.info(`Updated Muthu's preferences: defaultWorkDays=[1,4], requiredDaysPerWeek=2`);
    
    // Get today's date and find next Monday
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));
    const formattedDate = nextMonday.toISOString().split('T')[0];
    
    // Delete any existing bookings for Muthu in the next 4 weeks
    const Booking = db.booking;
    const fourWeeksLater = new Date(today);
    fourWeeksLater.setDate(today.getDate() + 28);
    
    const existingBookings = await Booking.findAll({
      where: {
        userId: muthu.id,
        bookingDate: {
          [db.Sequelize.Op.between]: [
            today.toISOString().split('T')[0], 
            fourWeeksLater.toISOString().split('T')[0]
          ]
        },
        status: { [db.Sequelize.Op.ne]: "cancelled" }
      }
    });
    
    logger.info(`Found ${existingBookings.length} existing bookings for Muthu`);
    
    // Cancel all existing bookings
    for (const booking of existingBookings) {
      await booking.update({ status: 'cancelled' });
      logger.info(`Cancelled booking ${booking.id} for date ${booking.bookingDate}`);
    }
    
    // Create fresh auto-bookings for Muthu
    logger.info('Creating new auto-bookings for Muthu');
    const results = await bookingService.createAutoBookingsForUser(
      muthu.id,
      formattedDate,
      null // system performed
    );
    
    if (results.success && results.success.length > 0) {
      logger.info(`Successfully created ${results.success.length} bookings for Muthu`);
      results.success.forEach(booking => {
        logger.info(`Created booking for date ${booking.date}`);
      });
    } else {
      logger.warn('No bookings created for Muthu');
      if (results.failed && results.failed.length > 0) {
        results.failed.forEach(failure => {
          logger.warn(`Failed booking for date ${failure.date}: ${failure.reason}`);
        });
      }
    }
    
    logger.info('Script completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();