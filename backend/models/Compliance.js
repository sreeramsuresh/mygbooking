// backend/models/Compliance.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Compliance = sequelize.define(
    "Compliance",
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
      week_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      required_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      actual_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: "pending",
        validate: {
          isIn: [["compliant", "non_compliant", "excused"]],
        },
      },
      manager_notes: {
        type: DataTypes.TEXT,
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
      tableName: "compliance",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "week_number", "year"],
        },
      ],
    }
  );

  return Compliance;
};
