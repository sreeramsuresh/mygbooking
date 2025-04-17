// frontend/src/pages/Bookings/MyBookings.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import { format, isAfter, isBefore, startOfToday } from "date-fns";
import useBookings from "../../hooks/useBookings";

const MyBookings = () => {
  const { myBookings, loading, error, fetchMyBookings, cancelBooking } =
    useBookings();

  const [tabValue, setTabValue] = useState(0);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [cancelDialogOpen, setcancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  useEffect(() => {
    if (myBookings) {
      filterBookings();
    }
  }, [myBookings, tabValue]);

  const filterBookings = () => {
    const today = startOfToday();

    if (tabValue === 0) {
      // Upcoming
      setFilteredBookings(
        myBookings.filter(
          (booking) =>
            booking.status !== "cancelled" &&
            !isBefore(new Date(booking.bookingDate), today)
        )
      );
    } else if (tabValue === 1) {
      // Past
      setFilteredBookings(
        myBookings.filter((booking) =>
          isBefore(new Date(booking.bookingDate), today)
        )
      );
    } else if (tabValue === 2) {
      // Cancelled
      setFilteredBookings(
        myBookings.filter((booking) => booking.status === "cancelled")
      );
    } else {
      setFilteredBookings(myBookings);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenCancelDialog = (booking) => {
    setSelectedBooking(booking);
    setCancelReason("");
    setCancelError("");
    setcancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setcancelDialogOpen(false);
    setSelectedBooking(null);
    setCancelReason("");
    setCancelError("");
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      setCancelling(true);
      setCancelError("");

      const result = await cancelBooking(selectedBooking.id, cancelReason);

      if (result.success) {
        // Close dialog and refresh bookings
        handleCloseCancelDialog();
        await fetchMyBookings();
      } else {
        setCancelError(result.message || "Failed to cancel booking");
      }
    } catch (err) {
      setCancelError("An error occurred while cancelling the booking");
      console.error("Cancel booking error:", err);
    } finally {
      setCancelling(false);
    }
  };

  const canCancelBooking = (booking) => {
    // Only allow cancellation for upcoming bookings with confirmed status
    const today = startOfToday();
    return (
      booking.status === "confirmed" &&
      !isBefore(new Date(booking.bookingDate), today)
    );
  };

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
        <Typography variant="h4">My Bookings</Typography>

        <Box>
          <Tooltip title="Refresh bookings">
            <IconButton onClick={fetchMyBookings} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            component={RouterLink}
            to="/bookings/new"
            startIcon={<AddIcon />}
          >
            New Booking
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="booking status tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Upcoming" />
          <Tab label="Past" />
          <Tab label="Cancelled" />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredBookings.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Seat</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check-in</TableCell>
                <TableCell>Check-out</TableCell>
                {tabValue === 0 && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1">
                        {format(
                          new Date(booking.bookingDate),
                          "EEE, MMM d, yyyy"
                        )}
                      </Typography>
                      {booking.isAutoBooked && (
                        <Tooltip title="Auto-booked">
                          <Chip
                            label="Auto"
                            size="small"
                            color="info"
                            sx={{ ml: 1 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <EventSeatIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        {booking.seat.seatNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        booking.status === "confirmed"
                          ? "Confirmed"
                          : booking.status === "cancelled"
                          ? "Cancelled"
                          : "Pending"
                      }
                      color={
                        booking.status === "confirmed"
                          ? "success"
                          : booking.status === "cancelled"
                          ? "error"
                          : "warning"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {booking.checkInTime ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <AccessTimeIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {format(new Date(booking.checkInTime), "h:mm a")}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not checked in
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {booking.checkOutTime ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <AccessTimeFilledIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {format(new Date(booking.checkOutTime), "h:mm a")}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not checked out
                      </Typography>
                    )}
                  </TableCell>
                  {tabValue === 0 && (
                    <TableCell>
                      {canCancelBooking(booking) && (
                        <Tooltip title="Cancel Booking">
                          <IconButton
                            color="error"
                            onClick={() => handleOpenCancelDialog(booking)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            No bookings found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {tabValue === 0
              ? "You don't have any upcoming bookings."
              : tabValue === 1
              ? "You don't have any past bookings."
              : "You don't have any cancelled bookings."}
          </Typography>
          {tabValue === 0 && (
            <Button
              variant="contained"
              component={RouterLink}
              to="/bookings/new"
              startIcon={<AddIcon />}
            >
              Create a Booking
            </Button>
          )}
        </Paper>
      )}

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Are you sure you want to cancel your booking for{" "}
                {format(
                  new Date(selectedBooking.bookingDate),
                  "EEEE, MMMM d, yyyy"
                )}
                ?
              </Typography>

              <Typography variant="body2" paragraph>
                Seat: {selectedBooking.seat.seatNumber}
              </Typography>

              {cancelError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {cancelError}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Reason for Cancellation (Optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                multiline
                rows={2}
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>Keep Booking</Button>
          <Button
            onClick={handleCancelBooking}
            variant="contained"
            color="error"
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={24} /> : "Cancel Booking"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyBookings;
