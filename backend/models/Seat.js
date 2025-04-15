// backend/models/Seat.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Seat = sequelize.define(
    "Seat",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      seat_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "seats",
      timestamps: false,
    }
  );

  return Seat;
};
