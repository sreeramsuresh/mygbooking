// frontend/src/components/booking/SeatSelector.jsx
import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import useBookings from "../../hooks/useBookings";

const SeatSelector = ({ selectedDate, onSeatSelected, onBookingCreated }) => {
  const { availableSeats, loading, error, fetchAvailableSeats, createBooking } =
    useBookings();
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [creating, setCreating] = useState(false);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSeats(selectedDate);
    }
  }, [selectedDate, fetchAvailableSeats]);

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
    if (onSeatSelected) {
      onSeatSelected(seat);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSeat || !selectedDate) return;

    setCreating(true);
    setBookingError("");

    try {
      const result = await createBooking(selectedSeat.id, selectedDate);

      if (result.success) {
        setSelectedSeat(null);
        if (onBookingCreated) {
          onBookingCreated(result.data);
        }
      } else {
        setBookingError(result.message || "Failed to create booking");
      }
    } catch (err) {
      setBookingError("An unexpected error occurred");
      console.error("Booking confirmation error:", err);
    } finally {
      setCreating(false);
    }
  };

  if (loading && !availableSeats.length) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!selectedDate) {
    return (
      <Alert severity="info">
        Please select a date to view available seats.
      </Alert>
    );
  }

  if (availableSeats.length === 0) {
    return (
      <Alert severity="warning">
        No seats available for the selected date.
      </Alert>
    );
  }

  return (
    <Box>
      {bookingError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {bookingError}
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        Select a Seat
      </Typography>

      <Typography variant="subtitle2" gutterBottom>
        Available: {availableSeats.length} seats
      </Typography>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {availableSeats.map((seat) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={seat.id}>
            <Card
              raised={selectedSeat?.id === seat.id}
              sx={{
                cursor: "pointer",
                borderColor:
                  selectedSeat?.id === seat.id ? "primary.main" : "transparent",
                borderWidth: 2,
                borderStyle: "solid",
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 3,
                },
              }}
              onClick={() => handleSeatClick(seat)}
            >
              <CardContent sx={{ textAlign: "center", p: 2 }}>
                <EventSeatIcon
                  color={selectedSeat?.id === seat.id ? "primary" : "action"}
                  sx={{ fontSize: 48 }}
                />
                <Typography variant="h6">Seat {seat.seatNumber}</Typography>
                <Chip
                  label="Available"
                  size="small"
                  color="success"
                  icon={<CheckCircleOutlineIcon />}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedSeat && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            disabled={creating}
            onClick={handleConfirmBooking}
            startIcon={creating ? <CircularProgress size={20} /> : null}
          >
            {creating ? "Booking..." : "Confirm Booking"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SeatSelector;
