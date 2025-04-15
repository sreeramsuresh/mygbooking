// frontend/src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import theme from "./theme";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";

// Layout Components
import AdminLayout from "./layouts/AdminLayout";
import ManagerLayout from "./layouts/ManagerLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";

// Pages
import Login from "./pages/Login";
import BookSeat from "./pages/BookSeat";
import ViewSchedule from "./pages/ViewSchedule";
import Requests from "./pages/Requests";
import AdminPanel from "./pages/AdminPanel";
import ManagerPanel from "./pages/ManagerPanel";
import NotFound from "./pages/NotFound";

// Protected Route Component
import ProtectedRoute from "./components/common/ProtectedRoute";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <AuthProvider>
          <BookingProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />

                {/* Admin Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminLayout>
                        <Routes>
                          <Route path="/" element={<AdminPanel />} />
                          <Route
                            path="users"
                            element={<AdminPanel tab="users" />}
                          />
                          <Route
                            path="schedules"
                            element={<AdminPanel tab="schedules" />}
                          />
                          <Route
                            path="reports"
                            element={<AdminPanel tab="reports" />}
                          />
                          <Route
                            path="settings"
                            element={<AdminPanel tab="settings" />}
                          />
                          <Route path="*" element={<Navigate to="/admin" />} />
                        </Routes>
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Manager Routes */}
                <Route
                  path="/manager/*"
                  element={
                    <ProtectedRoute requiredRole={["manager", "admin"]}>
                      <ManagerLayout>
                        <Routes>
                          <Route path="/" element={<ManagerPanel />} />
                          <Route
                            path="teams"
                            element={<ManagerPanel tab="teams" />}
                          />
                          <Route
                            path="approval"
                            element={<ManagerPanel tab="approval" />}
                          />
                          <Route
                            path="reports"
                            element={<ManagerPanel tab="reports" />}
                          />
                          <Route
                            path="*"
                            element={<Navigate to="/manager" />}
                          />
                        </Routes>
                      </ManagerLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Employee Routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <EmployeeLayout>
                        <Routes>
                          <Route
                            path="/"
                            element={<Navigate to="/dashboard" />}
                          />
                          <Route
                            path="/dashboard"
                            element={<ViewSchedule tab="dashboard" />}
                          />
                          <Route path="/book-seat" element={<BookSeat />} />
                          <Route path="/schedule" element={<ViewSchedule />} />
                          <Route path="/wfh-request" element={<Requests />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </EmployeeLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </BookingProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
