// Initial DB setup script
// backend/scripts/initDb.js
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const config = require("../config/database");

const initializeDatabase = async () => {
  const pool = new Pool(config);

  try {
    console.log("Connecting to PostgreSQL...");
    const client = await pool.connect();

    console.log("Creating tables if they don't exist...");

    // Read SQL schema from file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Execute SQL schema
    await client.query(schema);

    // Check if admin user exists
    const adminCheck = await client.query(
      "SELECT * FROM users WHERE role = $1",
      ["admin"]
    );

    // Create default admin if none exists
    if (adminCheck.rows.length === 0) {
      console.log("Creating default admin user...");

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      await client.query(
        `
        INSERT INTO users 
        (username, email, password, first_name, last_name, role) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        ["admin", "admin@giglabz.com", hashedPassword, "Admin", "User", "admin"]
      );
    }

    // Add default seats
    const seatCheck = await client.query("SELECT * FROM seats");

    if (seatCheck.rows.length === 0) {
      console.log("Adding default seats...");

      // Add 9 seats (as per capacity requirement)
      for (let i = 1; i <= 9; i++) {
        await client.query(
          `
          INSERT INTO seats (seat_number, location) VALUES ($1, $2)
        `,
          [i, "Main Office"]
        );
      }
    }

    console.log("Database initialization completed successfully!");
    client.release();
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    await pool.end();
  }
};

// Run if executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("Script execution completed");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Failed to initialize database:", err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
