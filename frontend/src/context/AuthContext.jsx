// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkLoggedIn = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);

          // Check if token is still valid
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

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(username, password);

      if (response.success) {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
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

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(`ROLE_${role.toUpperCase()}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        hasRole,
        isAuthenticated: !!user,
        isAdmin: hasRole("admin"),
        isManager: hasRole("manager") || hasRole("admin"),
        isEmployee:
          hasRole("employee") || hasRole("manager") || hasRole("admin"),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
