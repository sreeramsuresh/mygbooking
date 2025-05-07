// frontend/src/components/dashboard/EmployeeDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import format from "date-fns/format";
import dashboardService from "../../services/dashboardService";
import useAuth from "../../hooks/useAuth";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getEmployeeDashboard();

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

  // Extract data with default values for missing properties
  const {
    todayBooking = null,
    upcomingBookings = [],
    weeklyCompliance = { completed: 0, required: 0 },
    pendingRequests = [],
    currentWeek = { weekNumber: 0, startDate: new Date(), endDate: new Date() },
  } = dashboardData || {};

  return (
    <Box sx={{ mt: 4, mb: 8, px: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.fullName}
      </Typography>

      <Grid container spacing={3}>
        {/* Today's Booking Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Booking
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {todayBooking && todayBooking.seat ? (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      py: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "primary.main",
                        width: 80,
                        height: 80,
                        mb: 2,
                      }}
                    >
                      <EventSeatIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Typography variant="h5" gutterBottom>
                      Seat {todayBooking.seat?.seatNumber || "?"}
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="textSecondary"
                      gutterBottom
                    >
                      {todayBooking.seat?.description ||
                        "No description available"}
                    </Typography>

                    {todayBooking.checkInTime ? (
                      <Chip
                        label={`Checked In: ${format(
                          new Date(todayBooking.checkInTime),
                          "h:mm a"
                        )}`}
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        sx={{ mt: 2 }}
                        // TODO: Add check-in functionality here
                      >
                        Check In Now
                      </Button>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    You don't have a booking for today
                  </Typography>
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/bookings/new"
                    sx={{ mt: 2 }}
                    startIcon={<EventSeatIcon />}
                  >
                    Book a Seat
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Compliance Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Compliance Status
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  py: 2,
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Week {currentWeek?.weekNumber || "?"} (
                  {currentWeek?.startDate
                    ? format(new Date(currentWeek.startDate), "MMM d")
                    : "?"}{" "}
                  -{" "}
                  {currentWeek?.endDate
                    ? format(new Date(currentWeek.endDate), "MMM d")
                    : "?"}
                  )
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    mt: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      mr: 4,
                    }}
                  >
                    <Typography variant="h3" color="primary">
                      {weeklyCompliance.completed}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Days Completed
                    </Typography>
                  </Box>

                  <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      ml: 4,
                    }}
                  >
                    <Typography variant="h3" color="text.secondary">
                      {weeklyCompliance.required}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Days Required
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 3, width: "100%", textAlign: "center" }}>
                  {weeklyCompliance.completed >= weeklyCompliance.required ? (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      You've met your weekly office attendance requirement!
                    </Alert>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      You need{" "}
                      {weeklyCompliance.required - weeklyCompliance.completed}{" "}
                      more day(s) in the office this week.
                    </Alert>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Bookings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Upcoming Bookings</Typography>
                <Button
                  size="small"
                  component={RouterLink}
                  to="/bookings/my"
                  endIcon={<CalendarMonthIcon />}
                >
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {upcomingBookings && upcomingBookings.length > 0 ? (
                <List>
                  {upcomingBookings.map(
                    (booking) =>
                      booking && (
                        <ListItem key={booking.id || Math.random()} divider>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                              <EventIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              booking.bookingDate
                                ? format(
                                    new Date(booking.bookingDate),
                                    "EEEE, MMMM d"
                                  )
                                : "Unknown date"
                            }
                            secondary={
                              booking.seat
                                ? `Seat ${booking.seat.seatNumber || "?"} - ${
                                    booking.seat.description || "No description"
                                  }`
                                : "No seat information"
                            }
                          />
                          <Chip
                            label={
                              booking.isAutoBooked
                                ? "Auto Booked"
                                : "Manual Booking"
                            }
                            size="small"
                            color={booking.isAutoBooked ? "info" : "success"}
                          />
                        </ListItem>
                      )
                  )}
                </List>
              ) : dashboardData &&
                dashboardData.suggestedBookings &&
                dashboardData.suggestedBookings.length > 0 ? (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    These dates are suggested based on your preferred days
                  </Alert>
                  <List>
                    {dashboardData.suggestedBookings.map(
                      (suggestion, index) => (
                        <ListItem key={`suggestion-${index}`} divider>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "action.disabled" }}>
                              <EventIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={format(
                              new Date(suggestion.suggestedDate),
                              "EEEE, MMMM d"
                            )}
                            secondary="No booking yet - click to book"
                          />
                          <Button
                            component={RouterLink}
                            to="/bookings/new"
                            variant="outlined"
                            size="small"
                          >
                            Book
                          </Button>
                        </ListItem>
                      )
                    )}
                  </List>
                </>
              ) : (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography variant="body1" color="textSecondary">
                    You don't have any upcoming bookings
                  </Typography>
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/bookings/new"
                    sx={{ mt: 2 }}
                  >
                    Book a Seat
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Requests */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">My Requests</Typography>
                <Button
                  size="small"
                  component={RouterLink}
                  to="/requests/my"
                  endIcon={<WorkIcon />}
                >
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {pendingRequests && pendingRequests.length > 0 ? (
                <List>
                  {pendingRequests.map(
                    (request) =>
                      request && (
                        <ListItem key={request.id || Math.random()} divider>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor:
                                  request.type === "regularization"
                                    ? "warning.main"
                                    : "info.main",
                              }}
                            >
                              <WorkIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${
                              request.type === "regularization"
                                ? "Regularization"
                                : "Work From Home"
                            } - ${
                              request.date
                                ? format(new Date(request.date), "EEE, MMM d")
                                : "Unknown date"
                            }`}
                            secondary={`Reason: ${
                              request.reason
                                ? request.reason.substring(0, 30) + "..."
                                : "No reason provided"
                            }`}
                          />
                          <Chip
                            label={(request.status || "pending").toUpperCase()}
                            size="small"
                            color={
                              !request.status || request.status === "pending"
                                ? "warning"
                                : request.status === "approved"
                                ? "success"
                                : "error"
                            }
                          />
                        </ListItem>
                      )
                  )}
                </List>
              ) : (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography variant="body1" color="textSecondary">
                    You don't have any pending requests
                  </Typography>
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to="/requests/regularization"
                    >
                      Regularize
                    </Button>
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to="/requests/wfh"
                    >
                      Work From Home
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                {/* <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    component={RouterLink}
                    to="/bookings/new"
                    startIcon={<EventSeatIcon />}
                  >
                    Book a Seat
                  </Button>
                </Grid> */}
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    component={RouterLink}
                    to="/bookings/my"
                    startIcon={<CalendarMonthIcon />}
                  >
                    My Bookings
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    component={RouterLink}
                    to="/requests/regularization"
                    startIcon={<WorkIcon />}
                  >
                    Regularization
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    component={RouterLink}
                    to="/requests/wfh"
                    startIcon={<WorkIcon />}
                  >
                    Work From Home
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

export default EmployeeDashboard;
