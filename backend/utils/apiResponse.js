// backend/utils/apiResponse.js
/**
 * Standard API response formatter
 */
const apiResponse = {
  success: (res, message = "Success", data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },

  created: (res, message = "Created successfully", data = {}) => {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  },

  badRequest: (res, message = "Bad request") => {
    return res.status(400).json({
      success: false,
      message,
    });
  },

  unauthorized: (res, message = "Unauthorized") => {
    return res.status(401).json({
      success: false,
      message,
    });
  },

  forbidden: (res, message = "Forbidden") => {
    return res.status(403).json({
      success: false,
      message,
    });
  },

  notFound: (res, message = "Not found") => {
    return res.status(404).json({
      success: false,
      message,
    });
  },

  serverError: (res, error) => {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  },
};

module.exports = apiResponse;
