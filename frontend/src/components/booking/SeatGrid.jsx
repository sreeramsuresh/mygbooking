// frontend/src/components/booking/SeatGrid.jsx
import React, { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Box,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import bookingService from "../../services/bookingService";
import SeatItem from "./SeatItem";

const SeatGrid = ({ selectedDate, onBookingComplete }) => {
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);

  useEffect(() => {
    if (!selectedDate) return;

    const fetchSeats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get seats availability for selected date
        const response = await bookingService.getSeatsForDate(selectedDate);
        setSeats(response.data);

        // Check if user has an existing booking on this date
        const userBooking = await bookingService.getUserBookingForDate(
          selectedDate
        );
        if (userBooking.data) {
          setCurrentBooking(userBooking.data);
        } else {
          setCurrentBooking(null);
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to load seats. Please try again.");
        setLoading(false);
      }
    };

    fetchSeats();
  }, [selectedDate]);

  const handleSeatSelect = (seat) => {
    setSelectedSeat(seat);
    setConfirmDialog(true);
  };

  const handleConfirmBooking = async () => {
    try {
      setLoading(true);

      // If user already has a booking for this date, cancel it first
      if (currentBooking) {
        await bookingService.cancelBooking(currentBooking.id);
      }

      // Create new booking
      await bookingService.createBooking({
        seat_id: selectedSeat.id,
        booking_date: selectedDate,
      });

      setConfirmDialog(false);
      setLoading(false);

      // Reload seats
      const response = await bookingService.getSeatsForDate(selectedDate);
      setSeats(response.data);

      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (err) {
      setError("Failed to book seat. Please try again.");
      setLoading(false);
      setConfirmDialog(false);
    }
  };

  const cancelCurrentBooking = async () => {
    if (!currentBooking) return;

    try {
      setLoading(true);
      await bookingService.cancelBooking(currentBooking.id);

      setCurrentBooking(null);
      setLoading(false);

      // Reload seats
      const response = await bookingService.getSeatsForDate(selectedDate);
      setSeats(response.data);

      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (err) {
      setError("Failed to cancel booking. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Loading seats...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select a Seat for {new Date(selectedDate).toLocaleDateString()}
      </Typography>

      {currentBooking && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: "info.light" }}>
          <Typography>
            You already have Seat #{currentBooking.seat.seat_number} booked for
            this day.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            sx={{ mt: 1 }}
            onClick={cancelCurrentBooking}
          >
            Cancel Booking
          </Button>
        </Paper>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Paper
              sx={{
                p: 2,
                mb: 3,
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  width: "80%",
                  height: "20px",
                  bgcolor: "grey.300",
                  borderRadius: "10px 10px 0 0",
                }}
              />
            </Paper>
          </Box>
        </Grid>

        {/* First row of seats */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            {seats.slice(0, 5).map((seat) => (
              <SeatItem
                key={seat.id}
                seat={seat}
                onSelect={() => handleSeatSelect(seat)}
                currentBooking={currentBooking}
              />
            ))}
          </Box>
        </Grid>

        {/* Second row of seats */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 2,
              mt: 4,
            }}
          >
            {seats.slice(5, 10).map((seat) => (
              <SeatItem
                key={seat.id}
                seat={seat}
                onSelect={() => handleSeatSelect(seat)}
                currentBooking={currentBooking}
              />
            ))}
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: "grey.200",
              border: "1px solid grey.300",
            }}
          />
          <Typography variant="body2">Available</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: "primary.light",
              border: "1px solid primary.main",
            }}
          />
          <Typography variant="body2">Selected</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: "error.light",
              border: "1px solid error.main",
            }}
          />
          <Typography variant="body2">Booked</Typography>
        </Box>
      </Box>

      {/* Booking confirmation dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirm Booking</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to book Seat #{selectedSeat?.seat_number} for{" "}
            {new Date(selectedDate).toLocaleDateString()}?
          </Typography>
          {currentBooking && (
            <Typography color="error" sx={{ mt: 2 }}>
              This will cancel your existing booking for Seat #
              {currentBooking.seat.seat_number}.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmBooking}
            variant="contained"
            color="primary"
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SeatGrid;
