// backend/models/Schedule.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Schedule = sequelize.define(
    "Schedule",
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
      day_of_week: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          isIn: [["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]],
        },
      },
      required_days_per_week: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
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
      tableName: "schedules",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "day_of_week"],
        },
      ],
    }
  );

  return Schedule;
};
