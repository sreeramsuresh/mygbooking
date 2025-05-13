// frontend/src/pages/Home.jsx
import React, { useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Divider,
  Chip,
  useTheme,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  EventSeat as EventSeatIcon,
  EventAvailable as EventAvailableIcon,
  HomeWork as HomeWorkIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import useAuth from "../hooks/useAuth";
import EmployeeDashboard from "../components/dashboard/EmployeeDashboard";
import ManagerDashboard from "../components/dashboard/ManagerDashboard";
import AdminDashboard from "../components/dashboard/AdminDashboard";

const Home = () => {
  const { user, isAuthenticated, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // If authenticated, redirect to the appropriate dashboard
  useEffect(() => {
    if (isAuthenticated) {
      // Auto-redirect to dashboard is commented out to show the home page first
      // navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Render appropriate dashboard based on user role
  if (isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome, {user.fullName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Use the Office Seat Booking Application to manage your office seat bookings.
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }}>
          <Chip label="Quick Access" color="primary" />
        </Divider>

        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              component={RouterLink}
              to="/dashboard"
              sx={{
                height: "100%",
                textDecoration: "none",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 3,
                },
              }}
            >
              <CardActionArea sx={{ height: "100%", p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "50%",
                      bgcolor: "primary.light",
                      color: "primary.contrastText",
                      mb: 2,
                    }}
                  >
                    <DashboardIcon fontSize="large" />
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    My Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View your attendance status, upcoming bookings, and pending
                    requests.
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              component={RouterLink}
              to="/bookings/new"
              sx={{
                height: "100%",
                textDecoration: "none",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 3,
                },
              }}
            >
              <CardActionArea sx={{ height: "100%", p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "50%",
                      bgcolor: "secondary.light",
                      color: "secondary.contrastText",
                      mb: 2,
                    }}
                  >
                    <EventSeatIcon fontSize="large" />
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    Book a Seat
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reserve your office seat for upcoming work days.
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              component={RouterLink}
              to="/bookings/my"
              sx={{
                height: "100%",
                textDecoration: "none",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 3,
                },
              }}
            >
              <CardActionArea sx={{ height: "100%", p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "50%",
                      bgcolor: "info.light",
                      color: "info.contrastText",
                      mb: 2,
                    }}
                  >
                    <EventAvailableIcon fontSize="large" />
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    My Bookings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View and manage your existing seat bookings.
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              component={RouterLink}
              to="/requests/wfh"
              sx={{
                height: "100%",
                textDecoration: "none",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 3,
                },
              }}
            >
              <CardActionArea sx={{ height: "100%", p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "50%",
                      bgcolor: "success.light",
                      color: "success.contrastText",
                      mb: 2,
                    }}
                  >
                    <HomeWorkIcon fontSize="large" />
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    WFH Request
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Submit a work from home request.
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              component={RouterLink}
              to="/requests/regularization"
              sx={{
                height: "100%",
                textDecoration: "none",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 3,
                },
              }}
            >
              <CardActionArea sx={{ height: "100%", p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "50%",
                      bgcolor: "warning.light",
                      color: "warning.contrastText",
                      mb: 2,
                    }}
                  >
                    <AssignmentTurnedInIcon fontSize="large" />
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    Regularization
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Submit attendance regularization requests.
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              component={RouterLink}
              to="/profile"
              sx={{
                height: "100%",
                textDecoration: "none",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 3,
                },
              }}
            >
              <CardActionArea sx={{ height: "100%", p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "50%",
                      bgcolor: "grey.300",
                      color: "text.primary",
                      mb: 2,
                    }}
                  >
                    <PersonIcon fontSize="large" />
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    My Profile
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View and update your profile information.
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 4 }}>
          <Chip label="Dashboard" color="primary" />
        </Divider>

        {/* Display appropriate dashboard based on role */}
        {isAdmin ? (
          <AdminDashboard />
        ) : isManager ? (
          <ManagerDashboard />
        ) : (
          <EmployeeDashboard />
        )}
      </Container>
    );
  }

  // If not authenticated, show a welcome page with login/register options
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
          Office Seat Booking Application
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Manage your office attendance, book seats, and stay compliant with
            office policies.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3, borderRadius: 2, bgcolor: "primary.light" }}>
              <Typography variant="h5" gutterBottom>
                Key Features
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body1" paragraph>
                  Book your office seat in advance
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Track your weekly attendance compliance
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Request work from home and regularizations
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Real-time seat availability visualization
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Comprehensive dashboards for all roles
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                justifyContent: "center",
              }}
            >
              <Typography variant="h5" gutterBottom>
                Get Started
              </Typography>
              <Typography variant="body1" paragraph>
                Please log in to access your dashboard and manage your office
                attendance.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  component={RouterLink}
                  to="/login"
                  sx={{ mb: 2, py: 1.5 }}
                >
                  Login
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  fullWidth
                  component={RouterLink}
                  to="/register"
                  sx={{ py: 1.5 }}
                >
                  Register
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Home;
