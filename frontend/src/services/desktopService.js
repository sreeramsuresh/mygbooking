// frontend/src/services/desktopService.js
import axios from 'axios';
import { API_URL } from '../config';

const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token for authenticated requests
API.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.accessToken) {
          config.headers['Authorization'] = `Bearer ${user.accessToken}`;
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get all active desktop sessions
const getActiveSessions = async () => {
  try {
    const response = await API.get('/desktop/active-sessions');
    return response.data;
  } catch (error) {
    console.error('Error fetching active desktop sessions:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch active desktop sessions',
    };
  }
};

// Reset MAC address for a user
const resetMacAddress = async (userData) => {
  try {
    const response = await API.post('/desktop/reset-mac-address', userData);
    return response.data;
  } catch (error) {
    console.error('Error resetting MAC address:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to reset MAC address',
    };
  }
};

// Get attendance history
const getAttendanceHistory = async (params = {}) => {
  try {
    const response = await API.get('/desktop/attendance-history', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch attendance history',
    };
  }
};

// Cleanup inactive sessions
const cleanupInactiveSessions = async () => {
  try {
    const response = await API.post('/desktop/cleanup-inactive-sessions');
    return response.data;
  } catch (error) {
    console.error('Error cleaning up inactive sessions:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to clean up inactive sessions',
    };
  }
};

const desktopService = {
  getActiveSessions,
  resetMacAddress,
  getAttendanceHistory,
  cleanupInactiveSessions,
};

export default desktopService;