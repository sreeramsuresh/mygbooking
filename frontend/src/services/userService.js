// frontend/src/services/userService.js
import axios from "axios";
import { API_URL } from "../config";

const API_ENDPOINT = `${API_URL}/users`;

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.accessToken) {
      config.headers["Authorization"] = `Bearer ${user.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const userService = {
  getAllUsers: async () => {
    try {
      const response = await axios.get(API_ENDPOINT);
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getUserById: async (userId) => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/${userId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await axios.post(API_ENDPOINT, userData);
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await axios.put(`${API_ENDPOINT}/${userId}`, userData);
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await axios.delete(`${API_ENDPOINT}/${userId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  toggleUserStatus: async (userId, isActive) => {
    try {
      const response = await axios.patch(`${API_ENDPOINT}/${userId}/status`, {
        isActive,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  assignManager: async (userId, managerId) => {
    try {
      const response = await axios.patch(`${API_ENDPOINT}/${userId}/manager`, {
        managerId,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },
};

export default userService;
