// frontend/src/services/reportService.js
import axios from "axios";
import { API_URL } from "../config";

const API_ENDPOINT = `${API_URL}/reports`;

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

const reportService = {
  getAttendanceReport: async (startDate, endDate, departmentFilter = null) => {
    try {
      const params = { startDate, endDate };
      if (departmentFilter) {
        params.department = departmentFilter;
      }

      const response = await axios.get(`${API_ENDPOINT}/attendance`, {
        params,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getSeatUtilizationReport: async (startDate, endDate) => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/seat-utilization`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getComplianceReport: async (year, month, departmentFilter = null) => {
    try {
      const params = { year, month };
      if (departmentFilter) {
        params.department = departmentFilter;
      }

      const response = await axios.get(`${API_ENDPOINT}/compliance`, {
        params,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getRequestsReport: async (startDate, endDate, type = null) => {
    try {
      const params = { startDate, endDate };
      if (type) {
        params.type = type;
      }

      const response = await axios.get(`${API_ENDPOINT}/requests`, { params });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  exportAttendanceReport: async (
    startDate,
    endDate,
    departmentFilter = null,
    format = "csv"
  ) => {
    try {
      const params = { startDate, endDate, format };
      if (departmentFilter) {
        params.department = departmentFilter;
      }

      const response = await axios.get(`${API_ENDPOINT}/export/attendance`, {
        params,
        responseType: "blob",
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `attendance_report_${startDate}_to_${endDate}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      return { success: true };
    } catch (error) {
      if (error.response) {
        return { success: false, message: "Failed to export report" };
      }
      throw error;
    }
  },
};

export default reportService;
