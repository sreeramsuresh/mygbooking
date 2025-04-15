// frontend/src/components/attendance/CheckInForm.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  WifiOff as WifiOffIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import bookingService from "../../services/bookingService";
import attendanceService from "../../services/attendanceService";
import { useAuth } from "../../hooks/useAuth";

const CheckInForm = () => {
  const { user } = useAuth();
  const [currentBooking, setCurrentBooking] = useState(null);
  const [networkStatus, setNetworkStatus] = useState({
    checking: false,
    connected: false,
    ssid: null,
    ipAddress: null,
    error: null,
  });
  const [checkInStatus, setCheckInStatus] = useState({
    checking: false,
    success: false,
    error: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayBooking();
  }, []);

  const fetchTodayBooking = async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];
      const response = await bookingService.getUserBookingForDate(today);

      if (response.data) {
        setCurrentBooking(response.data);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching today's booking:", error);
      setLoading(false);
    }
  };

  const checkNetworkConnection = async () => {
    try {
      setNetworkStatus({
        ...networkStatus,
        checking: true,
        error: null,
      });

      // Request permission to access network information
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({
          name: "network-information",
        });

        if (permissionStatus.state !== "granted") {
          throw new Error("Network information permission not granted");
        }
      }

      // Get network information
      const networkInfo = await attendanceService.getNetworkInfo();

      setNetworkStatus({
        checking: false,
        connected: true,
        ssid: networkInfo.ssid,
        ipAddress: networkInfo.ipAddress,
        error: null,
      });

      return networkInfo;
    } catch (error) {
      console.error("Error checking network connection:", error);

      setNetworkStatus({
        checking: false,
        connected: false,
        ssid: null,
        ipAddress: null,
        error: error.message || "Failed to detect network",
      });

      return null;
    }
  };

  const handleCheckIn = async () => {
    try {
      // First check network connection
      setCheckInStatus({
        checking: true,
        success: false,
        error: null,
      });

      const networkInfo = await checkNetworkConnection();

      if (!networkInfo) {
        setCheckInStatus({
          checking: false,
          success: false,
          error:
            "Network check failed. Please ensure you are connected to the office network.",
        });
        return;
      }

      // Check if connected to the correct network
      if (networkInfo.ssid !== "GigLabz") {
        setCheckInStatus({
          checking: false,
          success: false,
          error: `You are connected to "${networkInfo.ssid}" network. Please connect to the office network (GigLabz) to check in.`,
        });
        return;
      }

      // Check if IP is from office network
      if (!networkInfo.ipAddress.startsWith("192.168.1.")) {
        setCheckInStatus({
          checking: false,
          success: false,
          error:
            "Your IP address is not from the office network. Please ensure you are physically in the office.",
        });
        return;
      }

      // Proceed with check-in
      const response = await attendanceService.checkIn({
        booking_id: currentBooking.id,
        ssid: networkInfo.ssid,
        ip_address: networkInfo.ipAddress,
      });

      // Update booking status
      setCurrentBooking({
        ...currentBooking,
        status: "checked_in",
        checked_in_at: new Date().toISOString(),
      });

      setCheckInStatus({
        checking: false,
        success: true,
        error: null,
      });
    } catch (error) {
      console.error("Error during check-in:", error);

      setCheckInStatus({
        checking: false,
        success: false,
        error:
          error.response?.data?.message ||
          "Failed to check in. Please try again or contact support.",
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentBooking) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          No Booking Found
        </Typography>
        <Typography>
          You don't have a seat booking for today. Please make a booking to
          check in.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          href="/book-seat"
        >
          Book a Seat
        </Button>
      </Paper>
    );
  }

  if (currentBooking.status === "checked_in") {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h6">Already Checked In</Typography>
        </Box>
        <Typography gutterBottom>
          You have successfully checked in for today.
        </Typography>
        <Typography variant="subtitle1">
          Seat: #{currentBooking.seat.seat_number}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Check-in time:{" "}
          {new Date(currentBooking.checked_in_at).toLocaleTimeString()}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Check In to Office
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Today's Booking Details:
        </Typography>
        <Typography>Seat: #{currentBooking.seat.seat_number}</Typography>
        <Typography>
          Date: {new Date(currentBooking.booking_date).toLocaleDateString()}
        </Typography>
      </Box>

      {checkInStatus.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {checkInStatus.error}
        </Alert>
      )}

      {checkInStatus.success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Successfully checked in! Welcome to the office.
        </Alert>
      )}

      {networkStatus.connected && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Network Information:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <LocationIcon />
              </ListItemIcon>
              <ListItemText
                primary="IP Address"
                secondary={networkStatus.ipAddress}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <WifiOffIcon />
              </ListItemIcon>
              <ListItemText
                primary="Network SSID"
                secondary={networkStatus.ssid}
              />
            </ListItem>
          </List>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={checkNetworkConnection}
          disabled={networkStatus.checking || checkInStatus.checking}
        >
          {networkStatus.checking ? (
            <CircularProgress size={24} />
          ) : (
            "Check Network"
          )}
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={handleCheckIn}
          disabled={
            networkStatus.checking ||
            checkInStatus.checking ||
            checkInStatus.success
          }
        >
          {checkInStatus.checking ? <CircularProgress size={24} /> : "Check In"}
        </Button>
      </Box>
    </Paper>
  );
};

export default CheckInForm;
