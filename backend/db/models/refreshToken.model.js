// backend/db/models/refreshToken.model.js
module.exports = (sequelize, Sequelize) => {
  const RefreshToken = sequelize.define("refreshTokens", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    expiryDate: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    isRevoked: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });

  return RefreshToken;
};
