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
            // Check if token is expired
            if (authService.isTokenExpired(parsedUser.accessToken)) {
              // Token is expired, try to refresh it
              if (parsedUser.refreshToken) {
                try {
                  const response = await authService.refreshToken(
                    parsedUser.refreshToken
                  );
                  if (response.success) {
                    // Token successfully refreshed, update user
                    setUser(parsedUser);
                  } else {
                    // Refresh failed, clear localStorage
                    localStorage.removeItem("user");
                  }
                } catch (refreshError) {
                  console.error(
                    "Error refreshing token on startup:",
                    refreshError
                  );
                  localStorage.removeItem("user");
                }
              } else {
                // No refresh token, clear localStorage
                localStorage.removeItem("user");
              }
            } else {
              // Token is still valid
              setUser(parsedUser);
            }
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
   * Login user with username/email and password
   */
  const login = async (login, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(login, password);

      if (response.success) {
        setUser(response.data);
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
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, we should still clear the local state
      setUser(null);
    }
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

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async () => {
    if (!user || !user.refreshToken) return false;

    try {
      const response = await authService.refreshToken(user.refreshToken);
      if (response.success) {
        // Update user with new tokens
        const updatedUser = {
          ...user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };
        setUser(updatedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  }, [user]);

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
    refreshToken,
    isAuthenticated: !!user,
    isAdmin: hasRole("admin"),
    isManager: hasRole("manager") || hasRole("admin"),
    isEmployee: hasRole("employee") || hasRole("manager") || hasRole("admin"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the AuthProvider as the default export
export default AuthProvider;
