// frontend/src/components/dashboard/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import PeopleIcon from "@mui/icons-material/People";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import RefreshIcon from "@mui/icons-material/Refresh";
import AutorenewIcon from "@mui/icons-material/Autorenew";

import dashboardService from "../../services/dashboardService";
import bookingService from "../../services/bookingService";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingAutoBookings, setCreatingAutoBookings] = useState(false);
  const [autoBookingResult, setAutoBookingResult] = useState(null);
  const [autoBookingError, setAutoBookingError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getAdminDashboard();

      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || "Failed to load dashboard data");
      }
    } catch (err) {
      setError("An error occurred while loading the dashboard");
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Refresh dashboard every 5 minutes
    const interval = setInterval(fetchDashboard, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateAutoBookings = async () => {
    try {
      setCreatingAutoBookings(true);
      setAutoBookingError(null);
      setAutoBookingResult(null);

      // Get next Monday date
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));

      // Format date for API
      const formattedDate = nextMonday.toISOString().split("T")[0];

      const response = await bookingService.createAutoBookings(formattedDate);

      if (response.success) {
        setAutoBookingResult(response.data);
        // Refresh dashboard data
        fetchDashboard();
      } else {
        setAutoBookingError(
          response.message || "Failed to create auto bookings"
        );
      }
    } catch (err) {
      setAutoBookingError("An error occurred while creating auto bookings");
      console.error("Auto booking error:", err);
    } finally {
      setCreatingAutoBookings(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">No dashboard data available</Alert>
      </Container>
    );
  }

  const {
    userCounts,
    seatUtilization,
    pendingRequests,
    todayAttendance,
    weeklyTrend,
  } = dashboardData;

  // COLORS for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // Prepare data for role distribution pie chart
  const roleData = [
    { name: "Admin", value: userCounts.admin },
    { name: "Manager", value: userCounts.manager },
    { name: "Employee", value: userCounts.employee },
  ];

  // Prepare data for seat utilization pie chart
  const seatData = [
    { name: "Booked", value: seatUtilization.booked },
    { name: "Available", value: seatUtilization.available },
  ];

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Admin Dashboard</Typography>

        <Box>
          <Tooltip title="Refresh dashboard">
            <IconButton onClick={fetchDashboard} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateAutoBookings}
            disabled={creatingAutoBookings}
            startIcon={
              creatingAutoBookings ? (
                <CircularProgress size={20} />
              ) : (
                <AutorenewIcon />
              )
            }
          >
            {creatingAutoBookings ? "Creating..." : "Create Auto Bookings"}
          </Button>
        </Box>
      </Box>

      {autoBookingError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {autoBookingError}
        </Alert>
      )}

      {autoBookingResult && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setAutoBookingResult(null)}
        >
          Successfully created {autoBookingResult.success.length} bookings.
          {autoBookingResult.failed.length > 0 &&
            ` Failed to create ${autoBookingResult.failed.length} bookings.`}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: "primary.light",
                    borderRadius: "50%",
                    p: 1,
                    mr: 2,
                  }}
                >
                  <PeopleIcon />
                </Box>
                <Typography variant="h6">Active Users</Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 2 }}>
                {userCounts.active}
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                component={RouterLink}
                to="/admin/users"
              >
                Manage Users
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: "success.light",
                    borderRadius: "50%",
                    p: 1,
                    mr: 2,
                  }}
                >
                  <EventSeatIcon />
                </Box>
                <Typography variant="h6">Seat Utilization</Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 2 }}>
                {seatUtilization.utilization}%
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                {seatUtilization.booked} of {seatUtilization.total} seats booked
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: "warning.light",
                    borderRadius: "50%",
                    p: 1,
                    mr: 2,
                  }}
                >
                  <AssignmentIcon />
                </Box>
                <Typography variant="h6">Pending Requests</Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 2 }}>
                {pendingRequests.total}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Regularization: {pendingRequests.regularization}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  WFH: {pendingRequests.wfh}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: "info.light",
                    borderRadius: "50%",
                    p: 1,
                    mr: 2,
                  }}
                >
                  <EventAvailableIcon />
                </Box>
                <Typography variant="h6">Today's Attendance</Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 2 }}>
                {todayAttendance}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Check-ins recorded today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Booking & Attendance Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weeklyTrend}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Bookings"
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#82ca9d"
                      name="Attendance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Role Distribution Chart */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Role Distribution
              </Typography>
              <Box
                sx={{ height: 300, display: "flex", justifyContent: "center" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {roleData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Seat Utilization */}
        <Grid item xs={12} sm={6} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Seat Utilization
              </Typography>
              <Box
                sx={{ height: 250, display: "flex", justifyContent: "center" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={seatData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      <Cell fill="#0088FE" />
                      <Cell fill="#00C49F" />
                    </Pie>
                    <ChartTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Day-wise Attendance */}
        <Grid item xs={12} sm={6} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Day-wise Attendance
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyTrend}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Bar
                      dataKey="attendance"
                      name="Attendance"
                      fill="#82ca9d"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Links */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    component={RouterLink}
                    to="/admin/users"
                    startIcon={<PeopleIcon />}
                  >
                    Manage Users
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    component={RouterLink}
                    to="/admin/reports"
                    startIcon={<AssignmentIcon />}
                  >
                    View Reports
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    component={RouterLink}
                    to="/requests/pending"
                    startIcon={<AssignmentIcon />}
                  >
                    Manage Requests
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    onClick={handleCreateAutoBookings}
                    disabled={creatingAutoBookings}
                    startIcon={
                      creatingAutoBookings ? (
                        <CircularProgress size={20} />
                      ) : (
                        <AutorenewIcon />
                      )
                    }
                  >
                    Auto Bookings
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
