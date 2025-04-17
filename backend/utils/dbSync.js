// backend/utils/dbSync.js
const bcrypt = require("bcryptjs");
const db = require("../db/models");
const logger = require("./logger");

const User = db.user;
const Role = db.role;
const Seat = db.seat;

/**
 * Initialize the database by creating tables and seeding initial data
 */
async function initDatabase() {
  try {
    logger.info("Checking database structure...");

    // Create tables if they don't exist
    await db.sequelize.sync({ alter: true });
    logger.info("Database synchronized successfully.");

    // Seed initial roles if they don't exist
    await seedRoles();

    // Seed admin user if it doesn't exist
    await seedAdminUser();

    // Seed initial seats if they don't exist
    await seedSeats();

    logger.info("Database initialization completed successfully.");
  } catch (error) {
    logger.error("Database initialization failed:", error);
    throw error;
  }
}

/**
 * Seed the roles table with default roles
 */
async function seedRoles() {
  try {
    const count = await Role.count();

    if (count === 0) {
      logger.info("Seeding roles...");

      await Promise.all([
        Role.create({ name: "admin" }),
        Role.create({ name: "manager" }),
        Role.create({ name: "employee" }),
      ]);

      logger.info("Roles seeded successfully.");
    } else {
      logger.info("Roles already exist, skipping seed.");
    }
  } catch (error) {
    logger.error("Error seeding roles:", error);
    throw error;
  }
}

/**
 * Seed an admin user if no users exist
 */
async function seedAdminUser() {
  try {
    const userCount = await User.count();

    if (userCount === 0) {
      logger.info("Creating admin user...");

      // Create admin user
      const adminUser = await User.create({
        username: "admin",
        email: "admin@example.com",
        password: bcrypt.hashSync(
          process.env.ADMIN_INITIAL_PASSWORD || "Admin@123",
          8
        ),
        fullName: "System Administrator",
        department: "IT",
        isActive: true,
        defaultWorkDays: [1, 2, 3, 4, 5],
        requiredDaysPerWeek: 2,
      });

      // Find admin role
      const adminRole = await Role.findOne({ where: { name: "admin" } });

      // Assign admin role to user
      await adminUser.setRoles([adminRole.id]);

      logger.info("Admin user created successfully.");
    } else {
      logger.info("Users already exist, skipping admin user creation.");
    }
  } catch (error) {
    logger.error("Error creating admin user:", error);
    throw error;
  }
}

/**
 * Seed initial seats
 */
async function seedSeats() {
  try {
    const seatCount = await Seat.count();

    if (seatCount === 0) {
      logger.info("Creating initial seats...");

      // Create 10 seats for the office
      const seatPromises = [];
      for (let i = 1; i <= 10; i++) {
        seatPromises.push(
          Seat.create({
            seatNumber: i,
            description: `Office Seat ${i}`,
            isActive: true,
          })
        );
      }

      await Promise.all(seatPromises);
      logger.info("Initial seats created successfully.");
    } else {
      logger.info("Seats already exist, skipping seat creation.");
    }
  } catch (error) {
    logger.error("Error creating seats:", error);
    throw error;
  }
}

// Utility function to handle database migrations if needed
async function runMigrations() {
  // This is where you would implement DB migrations if needed
  // For simplicity, we're using sequelize.sync with alter:true for now
  logger.info("No manual migrations needed with current setup.");
}

module.exports = {
  initDatabase,
  runMigrations,
};
