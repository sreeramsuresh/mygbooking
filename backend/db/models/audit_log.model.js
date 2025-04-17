// backend/db/models/audit_log.model.js
module.exports = (sequelize, Sequelize) => {
  const AuditLog = sequelize.define("audit_logs", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    entityType: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    entityId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    action: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    oldValues: {
      type: Sequelize.JSON,
    },
    newValues: {
      type: Sequelize.JSON,
    },
    performedBy: {
      type: Sequelize.INTEGER,
    },
    timestamp: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });

  return AuditLog;
};
