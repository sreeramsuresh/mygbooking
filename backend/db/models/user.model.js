// backend/db/models/user.model.js
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("users", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    fullName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    department: {
      type: Sequelize.STRING,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    defaultWorkDays: {
      type: Sequelize.ARRAY(Sequelize.INTEGER), // Days of week (0-6, where 0 is Sunday)
      defaultValue: [1, 2, 3, 4, 5], // Default to weekdays
    },
    requiredDaysPerWeek: {
      type: Sequelize.INTEGER,
      defaultValue: 2,
    },
  });

  return User;
};
