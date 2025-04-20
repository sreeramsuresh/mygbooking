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
    managerId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    defaultWorkDays: {
      type: Sequelize.ARRAY(Sequelize.INTEGER), // Days of week (0-6, where 0 is Sunday)
      defaultValue: [1, 2, 3, 4, 5], // Default to weekdays
      allowNull: false, // Ensure this is never null
      validate: {
        isValidDays(value) {
          if (!value || !Array.isArray(value) || value.length === 0) {
            throw new Error('Default work days must be a non-empty array of days');
          }
          
          // Validate that each day is between 0-6
          if (!value.every(day => Number.isInteger(day) && day >= 0 && day <= 6)) {
            throw new Error('Default work days must contain valid days (0-6)');
          }
        }
      }
    },
    requiredDaysPerWeek: {
      type: Sequelize.INTEGER,
      defaultValue: 2,
      allowNull: false, // Ensure this is never null
      validate: {
        min: 1,
        max: 7
      }
    },
  });

  return User;
};
