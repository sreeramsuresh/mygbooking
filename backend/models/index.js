// backend/models/index.js
const { Sequelize } = require("sequelize");
const config = require("../config/database");

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: "postgres",
    logging: false,
  }
);

// Import models
const User = require("./User")(sequelize);
const Schedule = require("./Schedule")(sequelize);
const Booking = require("./Booking")(sequelize);
const Seat = require("./Seat")(sequelize);
const WFHRequest = require("./WFHRequest")(sequelize);
const Attendance = require("./Attendance")(sequelize);
const Compliance = require("./Compliance")(sequelize);

// Define associations
User.hasMany(Schedule, { foreignKey: "user_id", as: "schedules" });
Schedule.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Booking, { foreignKey: "user_id" });
Booking.belongsTo(User, { foreignKey: "user_id" });

Seat.hasMany(Booking, { foreignKey: "seat_id" });
Booking.belongsTo(Seat, { foreignKey: "seat_id" });

User.hasMany(WFHRequest, { foreignKey: "user_id" });
WFHRequest.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Attendance, { foreignKey: "user_id" });
Attendance.belongsTo(User, { foreignKey: "user_id" });

Booking.hasOne(Attendance, { foreignKey: "booking_id" });
Attendance.belongsTo(Booking, { foreignKey: "booking_id" });

User.hasMany(Compliance, { foreignKey: "user_id" });
Compliance.belongsTo(User, { foreignKey: "user_id" });

// Export models and sequelize
module.exports = {
  sequelize,
  Sequelize,
  User,
  Schedule,
  Booking,
  Seat,
  WFHRequest,
  Attendance,
  Compliance,
};
