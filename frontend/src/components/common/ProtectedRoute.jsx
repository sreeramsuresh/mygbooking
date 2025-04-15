// frontend/src/components/common/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Protected Route component that requires authentication
 * Optionally can require specific role(s)
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // If still checking authentication status, show nothing (or could add a loading spinner)
  if (loading) {
    return null;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role check is required
  if (requiredRole) {
    // Convert to array if single role
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // Check if user has required role
    if (!roles.includes(user.role)) {
      // Redirect based on user's role
      switch (user.role) {
        case "admin":
          return <Navigate to="/admin" replace />;
        case "manager":
          return <Navigate to="/manager" replace />;
        default:
          return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // If authenticated and role check passes (if required), render children
  return children;
};

export default ProtectedRoute;
