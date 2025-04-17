// backend/db/models/seat.model.js
module.exports = (sequelize, Sequelize) => {
  const Seat = sequelize.define("seats", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    seatNumber: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
    },
    description: {
      type: Sequelize.STRING,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
  });

  return Seat;
};
