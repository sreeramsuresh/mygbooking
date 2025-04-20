// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Check if user is authenticated from local storage
   */
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);

          // Check if token exists
          if (parsedUser.accessToken) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem("user");
          }
        }
      } catch (err) {
        console.error("Failed to retrieve user from storage:", err);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  /**
   * Login user
   */
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(username, password);

      if (response.success) {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        
        // After successful login, trigger auto-booking creation
        try {
          const bookingResponse = await fetch('/api/bookings/ensure-auto-bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${response.data.accessToken}`
            }
          });
          const bookingData = await bookingResponse.json();
          console.log("Auto-booking setup result:", bookingData);
        } catch (bookingError) {
          console.error("Failed to set up auto-bookings:", bookingError);
          // Non-critical error, don't fail login
        }
        
        return { success: true };
      } else {
        setError(response.message || "Login failed");
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "An error occurred during login";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(userData);

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.message || "Registration failed");
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "An error occurred during registration";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.updateProfile(profileData);

      if (response.success) {
        // Update user in state and local storage with new profile data
        const updatedUser = { ...user, ...response.data };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return { success: true, data: response.data };
      } else {
        setError(response.message || "Profile update failed");
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "An error occurred during profile update";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role) => {
      if (!user || !user.roles) return false;
      return user.roles.includes(`ROLE_${role.toUpperCase()}`);
    },
    [user]
  );

  // Prepare context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    isAuthenticated: !!user,
    isAdmin: hasRole("admin"),
    isManager: hasRole("manager") || hasRole("admin"),
    isEmployee: hasRole("employee") || hasRole("manager") || hasRole("admin"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the AuthProvider as the default export
export default AuthProvider;
