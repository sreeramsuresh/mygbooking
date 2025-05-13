// frontend/src/services/authService.js
import axios from "axios";
import { API_URL } from "../config";

const API_ENDPOINT = `${API_URL}/auth`;

const authService = {
  login: async (login, password) => {
    try {
      const response = await axios.post(`${API_ENDPOINT}/signin`, {
        login,
        password,
      });

      // If login successful, store user data including tokens in localStorage
      if (response.data && response.data.success) {
        localStorage.setItem("user", JSON.stringify(response.data.data));
        
        // Start token expiration check timer
        authService.startTokenExpirationTimer();

        // After successful login, ensure user has auto-bookings
        try {
          await axios.post(
            `${API_URL}/bookings/ensure-auto-bookings`,
            {},
            {
              headers: {
                Authorization: `Bearer ${response.data.data.accessToken}`,
              },
            }
          );
          console.log("Auto-bookings check completed after login");
        } catch (autoBookingError) {
          console.error(
            "Error checking auto-bookings after login:",
            autoBookingError
          );
          // Don't fail the login if auto-booking check fails
        }
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

  refreshToken: async (refreshToken) => {
    try {
      const response = await axios.post(`${API_ENDPOINT}/refreshtoken`, {
        refreshToken,
      });

      if (response.data && response.data.success) {
        // Get the current user data
        const user = JSON.parse(localStorage.getItem("user"));

        // Update the access token and refresh token
        user.accessToken = response.data.data.accessToken;
        user.refreshToken = response.data.data.refreshToken;

        // Store the updated user data
        localStorage.setItem("user", JSON.stringify(user));
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  logout: async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (user.accessToken) {
        // Call the logout endpoint to invalidate refresh tokens
        await axios.post(
          `${API_ENDPOINT}/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          }
        );
      }

      // Remove user from localStorage
      localStorage.removeItem("user");
      
      // Clear token expiration timer
      if (window.tokenExpirationTimer) {
        clearInterval(window.tokenExpirationTimer);
        window.tokenExpirationTimer = null;
      }

      return { success: true };
    } catch (error) {
      // Even if the API call fails, we still want to remove the user from localStorage
      localStorage.removeItem("user");

      if (error.response) {
        return error.response.data;
      }
      return { success: true }; // Consider logout successful even if API fails
    }
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  },

  isTokenExpired: (token) => {
    if (!token) return true;

    try {
      // Split the token and get the payload
      const parts = token.split(".");
      if (parts.length !== 3) return true;

      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Add a buffer of 60 seconds to refresh token slightly before it expires
      const expirationBuffer = 60; // seconds
      return decoded.exp < (currentTime + expirationBuffer);
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
    }
  },
  
  // Start a timer to check token expiration periodically (for long idle periods)
  startTokenExpirationTimer: () => {
    const tokenCheckInterval = 5 * 60 * 1000; // Check every 5 minutes
    
    // Clear any existing timer
    if (window.tokenExpirationTimer) {
      clearInterval(window.tokenExpirationTimer);
    }
    
    window.tokenExpirationTimer = setInterval(() => {
      const user = authService.getCurrentUser();
      
      if (user && user.accessToken) {
        if (authService.isTokenExpired(user.accessToken)) {
          console.log("Token expired during idle period, refreshing...");
          
          // Try to refresh token
          authService.refreshToken(user.refreshToken).catch(error => {
            console.error("Failed to refresh token during idle check:", error);
            authService.logout();
            window.location.href = "/login?expired=true";
          });
        }
      } else {
        // No user logged in, stop the timer
        clearInterval(window.tokenExpirationTimer);
        window.tokenExpirationTimer = null;
      }
    }, tokenCheckInterval);
    
    return window.tokenExpirationTimer;
  },
};

export default authService;
