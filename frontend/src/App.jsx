// frontend/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import Layout from "./components/common/Layout";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import EmployeeDashboard from "./components/dashboard/EmployeeDashboard";
import ManagerDashboard from "./components/dashboard/ManagerDashboard";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import NewBooking from "./pages/Bookings/NewBooking";
import MyBookings from "./pages/Bookings/MyBookings";
import RegularizationForm from "./components/requests/RegularizationForm";
import WFHRequestForm from "./components/requests/WFHRequestForm";
import MyRequests from "./pages/Requests/MyRequests";
import PendingRequests from "./pages/Requests/PendingRequests";
import Profile from "./pages/Profile";
import Users from "./pages/Admin/Users";
import Reports from "./pages/Admin/Reports";
import AutoBookingManagement from "./pages/Admin/AutoBookingManagement";
import NotFound from "./pages/NotFound";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

const App = () => {
  const { isAuthenticated, isAdmin, isManager } = useAuth();

  // Helper function to render the appropriate dashboard based on user role
  const DashboardSelector = () => {
    if (isAdmin) {
      return <AdminDashboard />;
    } else if (isManager) {
      return <ManagerDashboard />;
    } else {
      return <EmployeeDashboard />;
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes */}
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardSelector />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/new"
          element={
            <ProtectedRoute restrict="admin">
              <NewBooking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/my"
          element={
            <ProtectedRoute restrict="admin">
              <MyBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests/regularization"
          element={
            <ProtectedRoute restrict="admin">
              <RegularizationForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests/wfh"
          element={
            <ProtectedRoute restrict="admin">
              <WFHRequestForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests/my"
          element={
            <ProtectedRoute restrict="admin">
              <MyRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests/pending"
          element={
            <ProtectedRoute requiredRoles={["manager", "admin"]}>
              <PendingRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/auto-booking"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <AutoBookingManagement />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
