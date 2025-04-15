// backend/utils/logger.js
const info = (message) => {
  console.log(`[INFO] ${message}`);
};

const error = (message, err = null) => {
  console.error(`[ERROR] ${message}`, err || "");
};

module.exports = {
  info,
  error,
};
