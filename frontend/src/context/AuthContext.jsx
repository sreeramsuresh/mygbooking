// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import authService from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkLoggedIn = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        const response = await authService.validateToken();
        setUser(response.data.user);
        setLoading(false);
      } catch (err) {
        localStorage.removeItem("token");
        setError(err.message);
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      setUser(user);
      setLoading(false);

      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      setLoading(false);
      return {
        success: false,
        error: err.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(userData);
      setLoading(false);

      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      setLoading(false);
      return {
        success: false,
        error: err.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
