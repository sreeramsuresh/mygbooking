// frontend/src/config.js
// Base API URL - change for production
export const API_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:8080/api";
