// frontend/src/components/dashboard/EmployeeDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  EventSeat as SeatIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import bookingService from "../../services/bookingService";
import scheduleService from "../../services/scheduleService";
import { useAuth } from "../../hooks/useAuth";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch user's schedule
        const scheduleRes = await scheduleService.getUserSchedule();
        setWeeklySchedule(scheduleRes.data);

        // Fetch upcoming bookings
        const bookingsRes = await bookingService.getUpcomingBookings();
        setUpcomingBookings(bookingsRes.data);

        // Fetch compliance status
        const complianceRes = await scheduleService.getUserCompliance();
        setComplianceStatus(complianceRes.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case "checked_in":
        return "success";
      case "booked":
        return "primary";
      case "missed":
        return "error";
      case "cancelled":
        return "warning";
      default:
        return "default";
    }
  };

  // Get compliance status text and color
  const getComplianceInfo = () => {
    if (!complianceStatus) return { text: "Unknown", color: "default" };

    const { requiredDays, actualDays, status } = complianceStatus;

    if (status === "compliant") {
      return {
        text: `Compliant (${actualDays}/${requiredDays} days)`,
        color: "success",
      };
    } else if (status === "non_compliant") {
      return {
        text: `Non-compliant (${actualDays}/${requiredDays} days)`,
        color: "error",
      };
    } else {
      return {
        text: `In progress (${actualDays}/${requiredDays} days)`,
        color: "warning",
      };
    }
  };

  const complianceInfo = getComplianceInfo();

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.first_name}!
      </Typography>

      {complianceStatus && complianceStatus.status === "non_compliant" && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You haven't met your required office days this week. Please book
          additional days or request WFH approval.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Weekly Schedule */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <CalendarIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">Your Weekly Schedule</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {weeklySchedule.length > 0 ? (
              <List>
                {weeklySchedule.map((day, index) => (
                  <ListItem
                    key={index}
                    divider={index < weeklySchedule.length - 1}
                  >
                    <ListItemText primary={day} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No scheduled days found.</Typography>
            )}

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Weekly Status:
              </Typography>
              <Chip
                label={complianceInfo.text}
                color={complianceInfo.color}
                variant="outlined"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Upcoming Bookings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <SeatIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">Upcoming Bookings</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {upcomingBookings.length > 0 ? (
              <List>
                {upcomingBookings.map((booking, index) => (
                  <ListItem
                    key={booking.id}
                    divider={index < upcomingBookings.length - 1}
                  >
                    <ListItemText
                      primary={formatDate(booking.booking_date)}
                      secondary={`Seat #${booking.seat.seat_number}`}
                    />
                    <Chip
                      label={booking.status.replace("_", " ")}
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No upcoming bookings found.</Typography>
            )}

            <Button
              variant="contained"
              color="primary"
              startIcon={<SeatIcon />}
              component={Link}
              to="/book-seat"
              sx={{ mt: 2 }}
            >
              Book a Seat
            </Button>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<SeatIcon />}
                component={Link}
                to="/book-seat"
              >
                Book Seat
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                component={Link}
                to="/wfh-request"
              >
                Request WFH
              </Button>
              <Button
                variant="outlined"
                startIcon={<CalendarIcon />}
                component={Link}
                to="/view-schedule"
              >
                View Schedule
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeDashboard;
