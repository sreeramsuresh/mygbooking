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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
import ComputerIcon from "@mui/icons-material/Computer";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import dashboardService from "../../services/dashboardService";
import bookingService from "../../services/bookingService";
import userService from "../../services/userService";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingAutoBookings, setCreatingAutoBookings] = useState(false);
  const [autoBookingResult, setAutoBookingResult] = useState(null);
  const [autoBookingError, setAutoBookingError] = useState(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [resetDate, setResetDate] = useState(new Date());
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetResult, setResetResult] = useState(null);
  const [userList, setUserList] = useState([]);
  const [todayAttendanceList, setTodayAttendanceList] = useState([]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getAdminDashboard();

      if (response.success) {
        setDashboardData(response.data);
        
        // Also fetch today's attendance details
        fetchTodayAttendance();
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

  const fetchTodayAttendance = async () => {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // This will need a new API endpoint in your backend
      const response = await dashboardService.getTodayAttendance(today);
      
      if (response.success) {
        setTodayAttendanceList(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching today's attendance:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      if (response.success) {
        setUserList(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchUsers();

    // Refresh dashboard every 5 minutes
    const interval = setInterval(fetchDashboard, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenResetDialog = () => {
    setSelectedUser("");
    setResetDate(new Date());
    setResetError("");
    setResetResult(null);
    setResetDialogOpen(true);
  };

  const handleCloseResetDialog = () => {
    setResetDialogOpen(false);
  };

  const handleResetAndAutoBook = async () => {
    if (!selectedUser) {
      setResetError("Please select a user");
      return;
    }

    try {
      setIsResetting(true);
      setResetError("");

      const formattedDate = resetDate.toISOString().split("T")[0];
      const response = await bookingService.resetAndAutoBook(
        selectedUser,
        formattedDate
      );

      if (response.success) {
        setResetResult(response.data);
        // Refresh dashboard data after a short delay
        setTimeout(() => {
          fetchDashboard();
        }, 1000);
      } else {
        setResetError(response.message || "Failed to reset and auto-book");
      }
    } catch (err) {
      setResetError("An error occurred while resetting bookings");
      console.error("Reset error:", err);
    } finally {
      setIsResetting(false);
    }
  };

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
    desktopSessions,
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
    <Box sx={{ mt: 4, mb: 8, px: 3 }}>
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

        {/* Today's Attendance List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Today's Attendance</Typography>
                <Tooltip title="Refresh attendance data">
                  <IconButton size="small" onClick={fetchTodayAttendance}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {todayAttendanceList.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Check-in Time</TableCell>
                        <TableCell>Network</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {todayAttendanceList.slice(0, 10).map((attendance) => (
                        <TableRow key={attendance.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon sx={{ mr: 1, fontSize: 'small', color: 'primary.main' }} />
                              <Box>
                                <Typography variant="body2">{attendance.user?.fullName || 'Unknown'}</Typography>
                                <Typography variant="caption" color="text.secondary">{attendance.user?.email}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{attendance.user?.department || 'N/A'}</TableCell>
                          <TableCell>
                            {attendance.checkInTime ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccessTimeIcon sx={{ mr: 1, fontSize: 'small', color: 'success.main' }} />
                                {format(new Date(attendance.checkInTime), 'h:mm a')}
                              </Box>
                            ) : 'Not checked in'}
                          </TableCell>
                          <TableCell>{attendance.network || 'Unknown'}</TableCell>
                          <TableCell>
                            {attendance.isOfficeNetwork ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CheckCircleIcon sx={{ mr: 1, fontSize: 'small', color: 'success.main' }} />
                                Office Network
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CancelIcon sx={{ mr: 1, fontSize: 'small', color: 'warning.main' }} />
                                External Network
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No attendance records for today yet
                  </Typography>
                </Box>
              )}
              
              {todayAttendanceList.length > 10 && (
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Button 
                    variant="text" 
                    component={RouterLink} 
                    to="/admin/reports" 
                    size="small"
                  >
                    View all attendance records
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Links */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ pb: 2 }}>
                Quick Actions
              </Typography>
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
                    component={RouterLink}
                    to="/admin/desktop-sessions"
                    startIcon={<ComputerIcon />}
                  >
                    Desktop Sessions
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;