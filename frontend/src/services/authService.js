// frontend/src/services/authService.js
import api from "./api";

const authService = {
  // Login user
  login: async (credentials) => {
    return await api.post("/auth/login", credentials);
  },

  // Register user (admin only)
  register: async (userData) => {
    return await api.post("/auth/register", userData);
  },

  // Validate token
  validateToken: async () => {
    return await api.get("/auth/validate");
  },

  // Logout (client-side only)
  logout: () => {
    localStorage.removeItem("token");
  },
};

export default authService;
