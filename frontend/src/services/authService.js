// frontend/src/services/authService.js
import api from "./api";
import axios from "axios";

// Standalone auth server URL
const AUTH_SERVER_URL = "http://localhost:5005/api";

// Login user
export const login = async (email, password, rememberMe = false) => {
  try {
    console.log("Attempting login with new Auth server first");
    
    // Try the standalone auth server first
    try {
      const response = await axios.post(`${AUTH_SERVER_URL}/auth/login`, { 
        email, 
        password, 
        rememberMe 
      });
      
      console.log("Login successful with standalone auth server");
      
      // Store token in localStorage if successful
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error("Login with standalone auth server failed:", error.message);
      console.error("Error details:", error.response?.data);
      
      // Fall back to original API
      console.log("Falling back to original API for login");
      const response = await api.post("/auth/login", { email, password, rememberMe });
      
      // Store token in localStorage if successful
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      
      return response.data;
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Register new user
export const register = async (userData) => {
  try {
    console.log("Trying direct axios registration");
    
    // Try direct axios request first (bypassing our API service)
    try {
      const directResponse = await axios.post("http://localhost:5000/api/auth/signup", userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("Direct registration succeeded:", directResponse.data);
      return directResponse.data;
    } catch (directError) {
      console.error("Direct registration failed:", directError.message);
      console.error("Direct error details:", directError.response?.data);
      
      // If direct request fails, try using our API service
      console.log("Falling back to api service...");
      const response = await api.post("/auth/signup", userData);
      return response.data;
    }
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Validate JWT token
export const validateToken = async () => {
  try {
    // Try standalone auth server first
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${AUTH_SERVER_URL}/auth/validate`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Token validation successful with standalone auth server");
      return response.data;
    } catch (error) {
      console.error("Token validation with standalone auth server failed:", error.message);
      
      // Fall back to original API
      console.log("Falling back to original API for token validation");
      const response = await api.get("/auth/validate");
      return response.data;
    }
  } catch (error) {
    console.error("Token validation error:", error);
    throw error;
  }
};

// Logout user - remove token from localStorage
export const logout = () => {
  localStorage.removeItem("token");
};

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    console.error("Password reset request error:", error);
    throw error;
  }
};

// Reset password with token
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post("/auth/reset-password", { 
      token, 
      newPassword 
    });
    return response.data;
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

// Export as default object for backward compatibility
const authService = {
  login,
  register,
  validateToken,
  logout,
  requestPasswordReset,
  resetPassword
};

export default authService;