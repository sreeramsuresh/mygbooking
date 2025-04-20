// frontend/src/pages/Bookings/NewBooking.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Breadcrumbs,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, addDays, isWeekend, isBefore, startOfToday } from "date-fns";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import useBookings from "../../hooks/useBookings";
import SeatSelector from "../../components/booking/SeatSelector";

const NewBooking = () => {
  const navigate = useNavigate();
  const { loading, error, createBooking, getAvailableSeats } = useBookings();

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSeatId, setSelectedSeatId] = useState("");
  const [availableSeats, setAvailableSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [seatsError, setSeatsError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Date constraints
  const today = startOfToday();
  const minDate = today;
  const maxDate = addDays(today, 14); // Allow booking up to 2 weeks in advance

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSeats();
    }
  }, [selectedDate]);

  const fetchAvailableSeats = async () => {
    if (!selectedDate) return;

    try {
      setIsLoadingSeats(true);
      setSeatsError("");
      setSelectedSeatId("");

      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const response = await getAvailableSeats(formattedDate);

      if (response.success) {
        // Check if the response has a nested structure with both available and booked seats
        if (response.data && typeof response.data === 'object' && response.data.availableSeats) {
          setAvailableSeats(response.data.availableSeats || []);
          setBookedSeats(response.data.bookedSeats || []);
        } else {
          // If the response just has available seats
          setAvailableSeats(response.data || []);
          // Try to get booked seats from a different API call or endpoint if needed
        }
      } else {
        setSeatsError(response.message || "Failed to load available seats");
      }
    } catch (err) {
      setSeatsError("An error occurred while fetching available seats");
      console.error("Fetch seats error:", err);
    } finally {
      setIsLoadingSeats(false);
    }
  };

  const handleSeatSelect = (seatId) => {
    setSelectedSeatId(seatId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedSeatId) {
      setBookingError("Please select both a date and a seat");
      return;
    }

    try {
      setIsSubmitting(true);
      setBookingError("");
      setBookingSuccess(false);

      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const response = await createBooking(selectedSeatId, formattedDate);

      if (response.success) {
        setBookingSuccess(true);

        // Reset form
        setSelectedDate(null);
        setSelectedSeatId("");
        setAvailableSeats([]);

        // Navigate to My Bookings after a short delay
        setTimeout(() => {
          navigate("/bookings/my");
        }, 2000);
      } else {
        if (response.message && response.message.includes("already have a booking for this date")) {
          setBookingError(
            "You already have a booking for this date. You can view or modify your existing booking in the My Bookings section."
          );
        } else {
          setBookingError(response.message || "Failed to create booking");
        }
      }
    } catch (err) {
      setBookingError("An error occurred while creating the booking");
      console.error("Booking create error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDateDisabled = (date) => {
    // Disable weekends and dates before today or after 2 weeks
    return isWeekend(date) || isBefore(date, today) || isBefore(maxDate, date);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container sx={{ mt: 4, mb: 8 }}>
        {/* Breadcrumbs Navigation */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          <Button
            component={RouterLink}
            to="/dashboard"
            startIcon={<HomeIcon />}
            size="small"
          >
            Dashboard
          </Button>
          <Typography color="text.primary">Book a Seat</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4">Book a Seat</Typography>

          <Button
            variant="outlined"
            component={RouterLink}
            to="/dashboard"
            startIcon={<HomeIcon />}
          >
            Back to Dashboard
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {bookingSuccess && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            icon={<CheckCircleIcon fontSize="inherit" />}
          >
            Booking created successfully! Redirecting to My Bookings...
          </Alert>
        )}

        {bookingError && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              bookingError.includes("already have a booking") ? (
                <Button 
                  color="inherit" 
                  size="small"
                  component={RouterLink}
                  to="/bookings/my"
                >
                  View My Bookings
                </Button>
              ) : null
            }
          >
            {bookingError}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CalendarTodayIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  Select Date
                </Typography>
                <Box
                  sx={{ my: 2, borderBottom: 1, borderColor: "divider", pb: 2 }}
                />

                <Box component="form" onSubmit={handleSubmit}>
                  <DatePicker
                    label="Booking Date"
                    value={selectedDate}
                    onChange={(newDate) => {
                      setSelectedDate(newDate);
                      setBookingSuccess(false);
                    }}
                    shouldDisableDate={isDateDisabled}
                    minDate={minDate}
                    maxDate={maxDate}
                    disablePast
                    sx={{ width: "100%", mb: 2 }}
                    slotProps={{
                      textField: {
                        required: true,
                        fullWidth: true,
                        margin: "normal",
                        helperText:
                          "Select a workday (Mon-Fri) within the next 2 weeks",
                      },
                    }}
                  />

                  <Alert
                    severity="info"
                    icon={<InfoIcon fontSize="inherit" />}
                    sx={{ mt: 2, mb: 2 }}
                  >
                    Seats can be booked up to 2 weeks in advance. Weekend
                    bookings are not available.
                  </Alert>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={!selectedDate || !selectedSeatId || isSubmitting}
                    sx={{ mt: 2 }}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Confirm Booking"
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <EventSeatIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  Select Seat
                </Typography>
                <Box
                  sx={{ my: 2, borderBottom: 1, borderColor: "divider", pb: 2 }}
                />

                {!selectedDate ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Please select a date first to see available seats
                    </Typography>
                  </Box>
                ) : isLoadingSeats ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 4 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : seatsError ? (
                  <Alert severity="error" sx={{ my: 2 }}>
                    {seatsError}
                  </Alert>
                ) : availableSeats.length === 0 ? (
                  <Alert severity="warning" sx={{ my: 2 }}>
                    No seats available for the selected date. Please choose
                    another date.
                  </Alert>
                ) : (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Available seats for{" "}
                        {format(selectedDate, "EEE, MMMM d, yyyy")}:
                      </Typography>
                    </Box>

                    <SeatSelector
                      seats={availableSeats}
                      bookedSeats={bookedSeats}
                      selectedSeatId={selectedSeatId}
                      onSeatSelect={handleSeatSelect}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default NewBooking;
