// frontend/src/services/authService.js
import api from "./api";

// Login user
export const login = async (email, password, rememberMe = false) => {
  try {
    const response = await api.post("/auth/login", { email, password, rememberMe });
    
    // Store token in localStorage if successful
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Register new user
export const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Validate JWT token
export const validateToken = async () => {
  try {
    const response = await api.get("/auth/validate");
    return response.data;
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