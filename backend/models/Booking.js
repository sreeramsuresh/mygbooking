// backend/models/Booking.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Booking = sequelize.define(
    "Booking",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      seat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "seats",
          key: "id",
        },
      },
      booking_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      week_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: "booked",
        validate: {
          isIn: [["booked", "checked_in", "missed", "cancelled"]],
        },
      },
      checked_in_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "bookings",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["seat_id", "booking_date"],
        },
      ],
    }
  );

  return Booking;
};
