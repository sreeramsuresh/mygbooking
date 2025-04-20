// scripts/simplifiedReset.js
require("dotenv").config();
const logger = require("../utils/logger");
const db = require("../db/models");
const dbConfig = require("../config/db.config");

async function resetDatabase() {
  try {
    logger.info("Starting simplified database reset process");

    // Instead of dropping all tables at once, turn off foreign key checks and drop tables individually
    logger.info("Dropping tables individually");

    const sequelize = db.sequelize;

    // Disable foreign key checks for the operation
    if (dbConfig.dialect === "postgres") {
      await sequelize.query("SET CONSTRAINTS ALL DEFERRED;");
    } else if (dbConfig.dialect === "mysql") {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;");
    }

    // Get all table names from the models
    const tableNames = Object.keys(sequelize.models).map(
      (model) => sequelize.models[model].tableName || model.toLowerCase() + "s"
    );

    // Add junction tables that might not be directly in the models
    tableNames.push("user_roles");

    // Drop each table
    for (const tableName of tableNames) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
        logger.info(`Dropped table: ${tableName}`);
      } catch (tableError) {
        logger.warn(`Error dropping table ${tableName}: ${tableError.message}`);
      }
    }

    // Re-enable foreign key checks
    if (dbConfig.dialect === "postgres") {
      await sequelize.query("SET CONSTRAINTS ALL IMMEDIATE;");
    } else if (dbConfig.dialect === "mysql") {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");
    }

    // Sync all models (create tables)
    logger.info("Creating tables");
    await sequelize.sync({ force: true });
    logger.info("All tables created successfully");

    // Now run the initialization to seed data
    logger.info("Seeding initial data");

    // Explicitly call the seeding functions
    const seedRoles = async () => {
      try {
        const Role = db.role;
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
    };

    const seedAdminUser = async () => {
      try {
        const User = db.user;
        const Role = db.role;
        const bcrypt = require("bcryptjs");

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
    };

    const seedSeats = async () => {
      try {
        const Seat = db.seat;
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
    };

    // Call seeding functions
    await seedRoles();
    await seedAdminUser();
    await seedSeats();

    logger.info("Database reset completed successfully");

    // Exit the script
    process.exit(0);
  } catch (error) {
    logger.error("Database reset failed:", error);
    process.exit(1);
  }
}

// Run the reset function
resetDatabase();
