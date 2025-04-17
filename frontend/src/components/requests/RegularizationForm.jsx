// frontend/src/services/requestService.js
import axios from "axios";
import { API_URL } from "../../config";

const API_ENDPOINT = `${API_URL}/requests`;

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

const requestService = {
  createRegularizationRequest: async (date, reason) => {
    try {
      const response = await axios.post(`${API_ENDPOINT}/regularization`, {
        date,
        reason,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  createWFHRequest: async (date, reason) => {
    try {
      const response = await axios.post(`${API_ENDPOINT}/wfh`, {
        date,
        reason,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getMyRequests: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/my`, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getPendingRequests: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/pending`, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  approveRequest: async (requestId, responseMessage = "") => {
    try {
      const response = await axios.post(
        `${API_ENDPOINT}/${requestId}/approve`,
        {
          responseMessage,
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  rejectRequest: async (requestId, responseMessage) => {
    try {
      const response = await axios.post(`${API_ENDPOINT}/${requestId}/reject`, {
        responseMessage,
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

export default requestService;
