// frontend/src/components/common/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import LoadingScreen from "./LoadingScreen";

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are required, check if user has at least one of them
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) =>
      user.roles.includes(`ROLE_${role.toUpperCase()}`)
    );

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
