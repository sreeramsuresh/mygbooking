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
