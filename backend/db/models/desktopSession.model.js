// backend/db/models/desktopSession.model.js
module.exports = (sequelize, Sequelize) => {
  const DesktopSession = sequelize.define("desktopSessions", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    macAddress: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    ssid: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    token: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    lastActivityAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  return DesktopSession;
};
