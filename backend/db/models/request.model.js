// backend/db/models/request.model.js
module.exports = (sequelize, Sequelize) => {
  const Request = sequelize.define("requests", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: Sequelize.ENUM("regularization", "wfh"),
      allowNull: false,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    responseMessage: {
      type: Sequelize.TEXT,
    },
    responseDate: {
      type: Sequelize.DATE,
    },
  });

  return Request;
};
