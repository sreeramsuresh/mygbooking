// frontend/src/config.js
// Base API URL - change for production
export const API_URL =
  process.env.NODE_ENV === "production"
    ? "/api"
    : //
      // "http://192.168.1.8:9600/api";
      // "http://localhost:9600/api";
      "https://gbooking.giglabz.co.in/api";
