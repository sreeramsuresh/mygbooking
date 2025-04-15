import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  EventSeat as SeatIcon, 
  CheckCircle as ConfirmIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays, format, isWithinInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import SeatGrid from '../components/booking/SeatGrid';
import { useBooking } from '../context/BookingContext';

// Mock data for available dates
const getAvailableDates = () => {
  const today = new Date();
  const nextTwoWeeks = [];
  
  // Generate next 10 weekdays
  let date = today;
  let weekdaysAdded = 0;
  
  while (weekdaysAdded < 10) {
    date = addDays(date, 1);
    const dayOfWeek = date.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      nextTwoWeeks.push(date);
      weekdaysAdded++;
    }
  }
  
  return nextTwoWeeks;
};

// Mock data for available seats
const getAvailableSeats = (date) => {
  // In a real app, this would be an API call to get available seats for the selected date
  const totalSeats = 9; // Maximum capacity
  const randomUnavailable = [];
  
  // Make some seats randomly unavailable
  const dateValue = date.getDate();
  if (dateValue % 2 === 0) {
    randomUnavailable.push(2, 5, 8);
  } else if (dateValue % 3 === 0) {
    randomUnavailable.push(1, 4, 7);
  } else {
    randomUnavailable.push(3, 6, 9);
  }
  
  // Generate seats
  const seats = [];
  for (let i = 1; i <= totalSeats; i++) {
    seats.push({
      id: i,
      number: i,
      available: !randomUnavailable.includes(i)
    });
  }
  
  return seats;
};

const BookSeat = () => {
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const { bookings } = useBooking();
  
  useEffect(() => {
    // Simulate API call to get available dates
    const fetchAvailableDates = () => {
      try {
        setLoading(true);
        const dates = getAvailableDates();
        setAvailableDates(dates);
        
        // Set default selected date to the first available date
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableDates();
  }, []);
  
  useEffect(() => {
    // Fetch available seats when selected date changes
    if (selectedDate) {
      setLoading(true);
      setSelectedSeat(null);
      
      // Simulate API call delay
      setTimeout(() => {
        const seats = getAvailableSeats(selectedDate);
        setAvailableSeats(seats);
        setLoading(false);
      }, 500);
    }
  }, [selectedDate]);
  
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };
  
  const handleSeatSelect = (seat) => {
    setSelectedSeat(seat.available ? seat : null);
  };
  
  const handleBookingConfirm = () => {
    setConfirmDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleBookingSubmit = () => {
    // In a real app, this would call the booking API
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setBookingSuccess(true);
      setConfirmDialogOpen(false);
      
      // Reset the form after a successful booking
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedSeat(null);
      }, 5000);
    }, 1000);
  };
  
  const formatDateDisplay = (date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  if (loading && !selectedDate) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Book a Seat
      </Typography>
      
      {bookingSuccess && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setBookingSuccess(false)}>
              Close
            </Button>
          }
        >
          Your booking has been confirmed for {selectedDate && formatDateDisplay(selectedDate)} - Seat #{selectedSeat?.number}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Date
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <DatePicker
              label="Booking Date"
              value={selectedDate}
              onChange={handleDateChange}
              disablePast
              shouldDisableDate={(date) => {
                // Disable weekends and dates beyond available range
                const dayOfWeek = date.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) return true; // Weekend
                
                // Check if date is within available dates
                return !availableDates.some(availableDate => 
                  isSameDay(date, availableDate)
                );
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: "normal"
                }
              }}
            />
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Your selection:
              </Typography>
              {selectedDate ? (
                <Typography variant="body1">
                  {formatDateDisplay(selectedDate)}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Please select a date
                </Typography>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Current Week Status:
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip 
                label="Required: 3 days" 
                size="small" 
                color="primary" 
                icon={<InfoIcon />} 
              />
              <Chip 
                label="Booked: 2 days" 
                size="small" 
                color="success" 
                icon={<ConfirmIcon />} 
              />
            </Stack>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Booking is available for the next 2 weeks only
            </Alert>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Select Seat
              </Typography>
              
              <Box>
                <Chip 
                  label="Available" 
                  size="small" 
                  color="primary" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  label="Unavailable" 
                  size="small" 
                  color="default" 
                />
              </Box>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              selectedDate ? (
                <>
                  <Typography gutterBottom sx={{ mb: 2 }}>
                    {formatDateDisplay(selectedDate)} " {availableSeats.filter(seat => seat.available).length} seats available
                  </Typography>
                
                  <SeatGrid 
                    seats={availableSeats} 
                    selectedSeat={selectedSeat} 
                    onSeatSelect={handleSeatSelect} 
                  />
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      {selectedSeat && (
                        <Typography>
                          Selected: <strong>Seat #{selectedSeat.number}</strong>
                        </Typography>
                      )}
                    </Box>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SeatIcon />}
                      disabled={!selectedSeat}
                      onClick={handleBookingConfirm}
                    >
                      Book Seat
                    </Button>
                  </Box>
                </>
              ) : (
                <Typography align="center" color="text.secondary">
                  Please select a date to view available seats
                </Typography>
              )
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleDialogClose}
      >
        <DialogTitle>Confirm Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to book Seat #{selectedSeat?.number} for {selectedDate && formatDateDisplay(selectedDate)}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleBookingSubmit} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookSeat;