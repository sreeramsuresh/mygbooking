// frontend/src/services/authService.js
import axios from "axios";
import { API_URL } from "../config";

const API_ENDPOINT = `${API_URL}/auth`;

const authService = {
  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_ENDPOINT}/signin`, {
        username,
        password,
      });
      
      // If login successful, store user data including preferences in localStorage
      if (response.data && response.data.success) {
        localStorage.setItem("user", JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  register: async (userData) => {
    try {
      // Include defaultWorkDays and requiredDaysPerWeek in the request
      const response = await axios.post(`${API_ENDPOINT}/signup`, userData);
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },
};

export default authService;
