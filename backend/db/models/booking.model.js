// backend/db/models/booking.model.js
module.exports = (sequelize, Sequelize) => {
  const Booking = sequelize.define("bookings", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bookingDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    weekNumber: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("confirmed", "cancelled", "pending"),
      defaultValue: "confirmed",
    },
    isAutoBooked: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    checkInTime: {
      type: Sequelize.DATE,
    },
    checkOutTime: {
      type: Sequelize.DATE,
    },
  });

  return Booking;
};
