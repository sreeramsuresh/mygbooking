// frontend/src/services/dashboardService.js
import axios from "axios";
import { API_URL } from "../config";

const API_ENDPOINT = `${API_URL}/dashboard`;

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

const dashboardService = {
  getEmployeeDashboard: async () => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/employee`);
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getManagerDashboard: async () => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/manager`);
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getAdminDashboard: async () => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/admin`);
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },
};

export default dashboardService;
