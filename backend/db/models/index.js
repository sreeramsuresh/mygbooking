// backend/db/models/index.js
const config = require("../../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.dialect,
  pool: config.pool,
  logging: config.logging,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model.js")(sequelize, Sequelize);
db.role = require("./role.model.js")(sequelize, Sequelize);
db.seat = require("./seat.model.js")(sequelize, Sequelize);
db.booking = require("./booking.model.js")(sequelize, Sequelize);
db.request = require("./request.model.js")(sequelize, Sequelize);
db.auditLog = require("./audit_log.model.js")(sequelize, Sequelize);
db.refreshToken = require("./refreshToken.model.js")(sequelize, Sequelize);

// Role-User relationship (many-to-many)
db.role.belongsToMany(db.user, {
  through: "user_roles",
  foreignKey: "roleId",
  otherKey: "userId",
});
db.user.belongsToMany(db.role, {
  through: "user_roles",
  foreignKey: "userId",
  otherKey: "roleId",
});

// Manager-Employee relationship (one-to-many, self-referencing)
db.user.hasMany(db.user, { as: "subordinates", foreignKey: "managerId" });
db.user.belongsTo(db.user, { as: "manager", foreignKey: "managerId" });

// User-Booking relationship (one-to-many)
db.user.hasMany(db.booking);
db.booking.belongsTo(db.user);

// Seat-Booking relationship (one-to-many)
db.seat.hasMany(db.booking);
db.booking.belongsTo(db.seat);

// User-Request relationship (one-to-many)
db.user.hasMany(db.request, { as: "requests", foreignKey: "userId" });
db.request.belongsTo(db.user, { foreignKey: "userId" });

// Manager-Request relationship (one-to-many)
db.user.hasMany(db.request, { as: "managedRequests", foreignKey: "managerId" });
db.request.belongsTo(db.user, { as: "manager", foreignKey: "managerId" });

// User-RefreshToken relationship (one-to-many)
db.user.hasMany(db.refreshToken);
db.refreshToken.belongsTo(db.user);

// Define ENUM for roles
db.ROLES = ["admin", "manager", "employee"];

module.exports = db;
