// backend/db/models/attendanceRecord.model.js
module.exports = (sequelize, Sequelize) => {
  const AttendanceRecord = sequelize.define("attendanceRecords", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    ssid: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    ipAddress: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    macAddress: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    computerName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    connectionStartTime: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    connectionEndTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    connectionDuration: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
  });

  return AttendanceRecord;
};
