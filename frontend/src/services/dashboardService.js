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
  
  resetAndAutoBookForUser: async (weekStartDate) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user ? user.id : null;
      
      if (!userId) {
        return { success: false, message: 'User not found' };
      }
      
      const response = await axios.post(`${API_URL}/bookings/reset-auto-book`, {
        userId,
        weekStartDate
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      return { success: false, message: error.message };
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

  // Get today's attendance records
  getTodayAttendance: async (date) => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/attendance`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      return { success: false, message: error.message };
    }
  },

  // Get weekly attendance report
  getWeeklyAttendanceReport: async (weekNumber, year) => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/attendance/weekly`, {
        params: { weekNumber, year }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      return { success: false, message: error.message };
    }
  },

  // Get monthly attendance report
  getMonthlyAttendanceReport: async (month, year) => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/attendance/monthly`, {
        params: { month, year }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      return { success: false, message: error.message };
    }
  },
};

export default dashboardService;
