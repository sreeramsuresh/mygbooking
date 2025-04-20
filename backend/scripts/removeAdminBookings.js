// Script to remove all bookings for admin users
require('dotenv').config();
const logger = require('../utils/logger');
const db = require('../db/models');

async function main() {
  try {
    logger.info('Starting script to remove admin bookings');
    
    // Connect to the database
    await db.sequelize.authenticate();
    logger.info('Connected to the database');
    
    // Find the admin role
    const Role = db.role;
    const adminRole = await Role.findOne({
      where: {
        name: 'admin'
      }
    });
    
    if (!adminRole) {
      logger.warn('Admin role not found in the database');
      process.exit(0);
    }
    
    // Find users with admin role
    const UserRoles = db.sequelize.models.user_roles || db.sequelize.models.userRoles;
    const adminUserRoles = await UserRoles.findAll({
      where: {
        roleId: adminRole.id
      }
    });
    
    const adminUserIds = adminUserRoles.map(ur => ur.userId);
    logger.info(`Found ${adminUserIds.length} admin users`);
    
    if (adminUserIds.length === 0) {
      logger.info('No admin users found, nothing to do');
      process.exit(0);
    }
    
    // Find all bookings for admin users
    const Booking = db.booking;
    const adminBookings = await Booking.findAll({
      where: {
        userId: {
          [db.Sequelize.Op.in]: adminUserIds
        },
        status: {
          [db.Sequelize.Op.ne]: 'cancelled'
        }
      }
    });
    
    logger.info(`Found ${adminBookings.length} active bookings for admin users`);
    
    // Cancel all admin bookings
    let cancelCount = 0;
    for (const booking of adminBookings) {
      await booking.update({
        status: 'cancelled'
      });
      cancelCount++;
    }
    
    logger.info(`Cancelled ${cancelCount} admin bookings successfully`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();